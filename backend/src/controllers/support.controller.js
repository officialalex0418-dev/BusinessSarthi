import { SupportTicket } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { audit } from '../utils/audit.js';
import { emails } from '../services/email.service.js';
import { realtime } from '../sockets/index.js';

/** Generate ticket number like BS-2026-000001 */
const generateTicketNumber = async () => {
    const year = new Date().getFullYear();
    const count = await SupportTicket.countDocuments();
    return `BS-${year}-${String(count + 1).padStart(6, '0')}`;
};

/** USER: Create support ticket */
export const createTicket = asyncHandler(async (req, res) => {
  const { subject, category, priority, description, attachments } = req.body;

  const ticketNumber = await generateTicketNumber();

  const ticket = await SupportTicket.create({
    ticketNumber,
    company: req.companyId,
    createdBy: req.user._id,
    createdByType: req.user.role === 'COMPANY_OWNER' ? 'COMPANY_OWNER' : (req.user.role === 'COMPANY_MANAGER' ? 'COMPANY_MANAGER' : 'STAFF'),
    subject,
    category,
    priority,
    description,
    attachments: attachments || []
  });

  // Notify super admins
  // In a real system, we might notify a specific support channel or email
  try {
     const recipient = process.env.SUPPORT_NOTIFICATION_EMAIL || 'support@businesssarthi.com';
     await emails.newTicketNotification(recipient, {
         ticketNumber, subject, category, priority, companyName: req.user.company?.name || 'Unknown'
     });
  } catch (e) {}

  audit({ req, action: 'CREATE_TICKET', entity: 'SupportTicket', entityId: ticket._id });
  res.status(201).json({ success: true, data: ticket });
});

/** USER/ADMIN: List tickets (tenant isolated for users) */
export const listTickets = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  // Admin sees all, users see only their company
  if (req.user.role !== 'SUPER_ADMIN') {
    filter.company = req.companyId;
    // Staff can only see their own tickets unless they have management permissions (can be refined)
    if (req.user.role === 'STAFF') {
        const perms = req.user.designation?.permissions;
        if (!perms?.staff && !perms?.configuration) {
           filter.createdBy = req.user._id;
        }
    }
  } else {
    if (req.query.companyId) filter.company = req.query.companyId;
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.category) filter.category = req.query.category;

  if (req.query.search) {
    filter.$or = [
      { ticketNumber: { $regex: req.query.search, $options: 'i' } },
      { subject: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    SupportTicket.find(filter)
      .populate('company', 'name')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort('-lastActivityAt')
      .skip(skip)
      .limit(limit),
    SupportTicket.countDocuments(filter),
  ]);

  res.json({ success: true, data: paginatedResponse(items, total, page, limit) });
});

/** USER/ADMIN: Get ticket detail */
export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .populate('company', 'name')
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .populate('messages.sender', 'name role')
    .populate('internalNotes.author', 'name email');

  if (!ticket) throw ApiError.notFound('Ticket not found');

  // Authorization check
  const ticketCompanyId = ticket.company._id ? ticket.company._id.toString() : ticket.company.toString();
  if (req.user.role !== 'SUPER_ADMIN' && ticketCompanyId !== req.companyId) {
    throw ApiError.forbidden('Access denied');
  }

  res.json({ success: true, data: ticket });
});

/** USER/ADMIN: Add reply to ticket */
export const addMessage = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id).populate('company');
  if (!ticket) throw ApiError.notFound('Ticket not found');

  // Authorization check
  const isAdmin = req.user.role === 'SUPER_ADMIN';
  const ticketCompanyId = ticket.company._id ? ticket.company._id.toString() : ticket.company.toString();
  if (!isAdmin && ticketCompanyId !== req.companyId) {
    throw ApiError.forbidden('Access denied');
  }

  // Messaging is disabled for resolved or closed tickets
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
    throw ApiError.badRequest('This support ticket is resolved or closed. Messaging is disabled.');
  }

  const { message, attachments } = req.body;
  const newMsg = {
    senderType: isAdmin ? 'ADMIN' : 'USER',
    sender: req.user._id,
    message,
    attachments: attachments || [],
    createdAt: new Date()
  };

  ticket.messages.push(newMsg);
  ticket.lastActivityAt = new Date();

  // Status management
  if (isAdmin) {
      if (ticket.status === 'OPEN' || ticket.status === 'WAITING_FOR_USER') {
          ticket.status = 'IN_PROGRESS';
      }
  } else {
      if (ticket.status === 'IN_PROGRESS') {
          ticket.status = 'OPEN';
      }
  }

  await ticket.save();

  // Construct message object with sender name for real-time broadcast
  const savedMsg = ticket.messages[ticket.messages.length - 1];
  const socketPayload = {
    ticketId: ticket._id.toString(),
    message: {
      _id: savedMsg._id,
      senderType: savedMsg.senderType,
      sender: {
        _id: req.user._id,
        name: req.user.name,
        role: req.user.role
      },
      message: savedMsg.message,
      attachments: savedMsg.attachments || [],
      createdAt: savedMsg.createdAt
    },
    status: ticket.status,
    lastActivityAt: ticket.lastActivityAt
  };

  realtime.ticketMessage(ticket._id.toString(), socketPayload);

  // Notify counterpart
  if (isAdmin) {
      if (ticket.createdBy) {
         realtime.notify(ticket.createdBy.toString(), {
            title: `New reply on ticket ${ticket.ticketNumber}`,
            message: `${req.user.name}: ${message.slice(0, 100)}`,
            link: `/staff/support/${ticket._id}`
         });
      }
      try {
          await emails.ticketReplyNotification(ticket.createdBy.email, {
              ticketNumber: ticket.ticketNumber,
              subject: ticket.subject,
              message
          });
      } catch (e) {}
  } else {
      // Notify assigned admin or support team
  }

  audit({ req, action: 'REPLY_TICKET', entity: 'SupportTicket', entityId: ticket._id });
  res.json({ success: true, data: ticket });
});

/** ADMIN: Update ticket status/priority/assignment */
export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  const { status, priority, assignedTo } = req.body;

  if (status && status !== ticket.status) {
    ticket.activity.push({
        action: 'STATUS_CHANGED',
        oldStatus: ticket.status,
        newStatus: status,
        performedBy: req.user._id,
        at: new Date()
    });
    ticket.status = status;
    if (status === 'RESOLVED') ticket.resolvedAt = new Date();
    if (status === 'CLOSED') ticket.closedAt = new Date();
  }

  if (priority && priority !== ticket.priority) {
    ticket.activity.push({
        action: 'PRIORITY_CHANGED',
        oldPriority: ticket.priority,
        newPriority: priority,
        performedBy: req.user._id,
        at: new Date()
    });
    ticket.priority = priority;
  }

  if (assignedTo !== undefined) {
    ticket.assignedTo = assignedTo || null;
    ticket.activity.push({
        action: 'ASSIGNED',
        meta: { assignedTo },
        performedBy: req.user._id,
        at: new Date()
    });
  }

  await ticket.save();

  // Broadcast real-time status update
  realtime.ticketUpdate(ticket._id.toString(), {
    ticketId: ticket._id.toString(),
    status: ticket.status,
    priority: ticket.priority,
    assignedTo: ticket.assignedTo,
    activity: ticket.activity
  });

  audit({ req, action: 'UPDATE_TICKET', entity: 'SupportTicket', entityId: ticket._id });
  res.json({ success: true, data: ticket });
});

/** ADMIN: Add internal note */
export const addNote = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found');

  ticket.internalNotes.push({
    author: req.user._id,
    note: req.body.note,
    createdAt: new Date()
  });

  await ticket.save();

  // Broadcast note update to ticket room
  realtime.ticketNote(ticket._id.toString(), {
    ticketId: ticket._id.toString(),
    internalNotes: ticket.internalNotes
  });

  res.json({ success: true, data: ticket });
});
