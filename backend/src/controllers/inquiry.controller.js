import { Inquiry } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { audit } from '../utils/audit.js';
import { emails } from '../services/email.service.js';

/** PUBLIC: Create inquiry from website */
export const createInquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, companyName, subject, message } = req.body;

  const inquiry = await Inquiry.create({
    name, email, phone, companyName, subject, message,
    source: 'WEBSITE'
  });

  // Notify internal team
  try {
    // If there is an environment variable for notification email, use it.
    // Otherwise we might notify all super admins or a default address.
    const recipient = process.env.INQUIRY_NOTIFICATION_EMAIL || 'admin@businesssarthi.com';
    await emails.newInquiryNotification(recipient, {
        name, email, phone, companyName, subject, message
    });
  } catch (e) {
    console.error('[INQUIRY] Notification email failed:', e.message);
  }

  // Confirmation email to visitor
  try {
    await emails.inquiryConfirmation(email, { name });
  } catch (e) {}

  res.status(201).json({
    success: true,
    message: 'Thank you for contacting Business Sarthi. Your inquiry has been received.'
  });
});

/** ADMIN: List inquiries */
export const listInquiries = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { companyName: { $regex: req.query.search, $options: 'i' } },
      { subject: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Inquiry.find(filter)
      .populate('assignedTo', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Inquiry.countDocuments(filter),
  ]);

  // Aggregate stats for dashboard
  const stats = await Inquiry.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    data: {
        ...paginatedResponse(items, total, page, limit),
        stats: stats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {})
    }
  });
});

/** ADMIN: Get inquiry detail */
export const getInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('replies.sender', 'name email')
    .populate('internalNotes.author', 'name email');

  if (!inquiry) throw ApiError.notFound('Inquiry not found');
  res.json({ success: true, data: inquiry });
});

/** ADMIN: Update inquiry status/priority/assignment */
export const updateInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) throw ApiError.notFound('Inquiry not found');

  const { status, priority, assignedTo } = req.body;
  const oldStatus = inquiry.status;
  const oldPriority = inquiry.priority;

  if (status && status !== inquiry.status) {
    inquiry.activity.push({
        action: 'STATUS_CHANGED',
        oldStatus: inquiry.status,
        newStatus: status,
        performedBy: req.user._id,
        at: new Date()
    });
    inquiry.status = status;
    if (status === 'ONBOARDED') inquiry.resolvedAt = new Date();
  }

  if (priority && priority !== inquiry.priority) {
    inquiry.activity.push({
        action: 'PRIORITY_CHANGED',
        oldPriority: inquiry.priority,
        newPriority: priority,
        performedBy: req.user._id,
        at: new Date()
    });
    inquiry.priority = priority;
  }

  if (assignedTo !== undefined) {
    inquiry.assignedTo = assignedTo || null;
    inquiry.activity.push({
        action: 'ASSIGNED',
        meta: { assignedTo },
        performedBy: req.user._id,
        at: new Date()
    });
  }

  await inquiry.save();
  audit({ req, action: 'UPDATE_INQUIRY', entity: 'Inquiry', entityId: inquiry._id });
  res.json({ success: true, data: inquiry });
});

/** ADMIN: Add reply to inquiry */
export const addReply = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) throw ApiError.notFound('Inquiry not found');

  const { message } = req.body;
  inquiry.replies.push({
    senderType: 'ADMIN',
    sender: req.user._id,
    message,
    createdAt: new Date()
  });

  inquiry.lastRepliedAt = new Date();

  // Auto-move to IN_PROGRESS if NEW
  if (inquiry.status === 'NEW') {
      inquiry.status = 'IN_PROGRESS';
      inquiry.activity.push({
          action: 'STATUS_CHANGED',
          oldStatus: 'NEW',
          newStatus: 'IN_PROGRESS',
          performedBy: req.user._id,
          at: new Date()
      });
  }

  await inquiry.save();

  // Send email to customer
  try {
    await emails.inquiryReply(inquiry.email, {
        name: inquiry.name,
        subject: inquiry.subject,
        message,
    });
  } catch (e) {
    console.error('[INQUIRY] Reply email failed:', e.message);
  }

  audit({ req, action: 'REPLY_INQUIRY', entity: 'Inquiry', entityId: inquiry._id });
  res.json({ success: true, data: inquiry });
});

/** ADMIN: Add internal note */
export const addNote = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) throw ApiError.notFound('Inquiry not found');

  inquiry.internalNotes.push({
    author: req.user._id,
    note: req.body.note,
    createdAt: new Date()
  });

  await inquiry.save();
  res.json({ success: true, data: inquiry });
});
