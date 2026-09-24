import { Complaint, ComplaintMessage, User, Company } from '../models/index.js';
import { asyncHandler, ApiError } from '../utils/ApiError.js';
import { notify } from '../services/notification.service.js';

/**
 * @desc    Create a new complaint
 * @route   POST /api/v1/complaints
 */
export const createComplaint = asyncHandler(async (req, res) => {
  const { recipientId, subject, message, isGroup, attachments } = req.body;

  const company = await Company.findById(req.user.company).populate('package');
  const retentionDays = company?.package?.complaintRetentionDays || 90;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + retentionDays);

  const complaintData = {
    sender: req.user._id,
    company: req.user.company,
    subject,
    message,
    isGroup: isGroup === true,
    recipient: isGroup ? null : (recipientId || null),
    expiresAt,
  };

  const complaint = await Complaint.create(complaintData);

  await ComplaintMessage.create({
    complaint: complaint._id,
    sender: req.user._id,
    message,
    expiresAt,
    attachments: attachments || [],
  });

  complaint.lastMessage = message ? message.substring(0, 497) : 'Sent an attachment';
  complaint.lastMessageAt = new Date();
  complaint.lastMessageSender = req.user._id;
  await complaint.save();

  const senderIdStr = req.user._id.toString();

  const notificationPayload = {
    company: req.user.company,
    type: 'COMPLAINT_NEW',
    title: `New Complaint from ${req.user.name}`,
    message: `${subject}${message ? `: ${message}` : ''}`,
    link: '/staff/complaints',
    data: { complaintId: complaint._id.toString(), type: 'COMPLAINT_NEW' }
  };

  if (complaint.recipient) {
    const targetRecipientId = complaint.recipient._id ? complaint.recipient._id.toString() : complaint.recipient.toString();
    console.log(`[COMPLAINT NOTIF CREATE] Sender: ${senderIdStr} | Recipient: ${targetRecipientId}`);
    notify({ ...notificationPayload, recipient: targetRecipientId }).catch(e => console.error('Complaint notification failed:', e));
  } else if (complaint.isGroup) {
    const companyUsers = await User.find({
      company: req.user.company,
      _id: { $ne: req.user._id },
      isActive: true,
    }).select('_id');
    let recipients = companyUsers.map(u => u._id.toString());
    if (recipients.length === 0) {
      recipients = [senderIdStr];
    }
    console.log(`[COMPLAINT NOTIF CREATE GROUP] Sender: ${senderIdStr} | Recipients: ${recipients.join(', ')}`);
    import('../services/notification.service.js').then(({ notifyMany }) => {
      notifyMany(recipients, notificationPayload).catch(e => console.error('Complaint notification failed:', e));
    });
  }

  return res.status(201).json({ success: true, data: complaint });
});

/**
 * @desc    Get complaints for current user
 * @route   GET /api/v1/complaints
 */
export const getComplaints = asyncHandler(async (req, res) => {
  const filter = {
    company: req.user.company,
    $or: [
      { isGroup: true },
      { sender: req.user._id },
      { recipient: req.user._id },
    ]
  };

  const complaints = await Complaint.find(filter)
    .populate('sender', 'name position')
    .populate('recipient', 'name position')
    .populate('lastMessageSender', 'name')
    .sort('-lastMessageAt');

  res.status(200).json({ success: true, data: complaints });
});

/**
 * @desc    Get messages for a complaint
 * @route   GET /api/v1/complaints/:id/messages
 */
export const getComplaintMessages = asyncHandler(async (req, res) => {
  const messages = await ComplaintMessage.find({ complaint: req.params.id })
    .populate('sender', 'name profilePhoto role')
    .sort('createdAt');
  res.status(200).json({ success: true, data: messages });
});

/**
 * @desc    Add a message/reply to a complaint
 * @route   POST /api/v1/complaints/:id/messages
 */
export const addComplaintReply = asyncHandler(async (req, res) => {
  const { message, attachments } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw ApiError.notFound('Complaint not found');

  const company = await Company.findById(req.user.company).populate('package');
  const retentionDays = company?.package?.complaintRetentionDays || 90;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + retentionDays);

  const reply = await ComplaintMessage.create({
    complaint: complaint._id,
    sender: req.user._id,
    message,
    expiresAt,
    attachments: attachments || [],
  });

  complaint.lastMessage = message ? message.substring(0, 497) : 'Sent an attachment';
  complaint.lastMessageAt = new Date();
  complaint.lastMessageSender = req.user._id;
  complaint.expiresAt = expiresAt;
  await complaint.save();

  await ComplaintMessage.updateMany({ complaint: complaint._id }, { expiresAt });

  const senderIdStr = req.user._id.toString();

  let targetRecipientId = complaint.sender?.toString() === senderIdStr
    ? (complaint.recipient ? complaint.recipient.toString() : null)
    : (complaint.sender ? complaint.sender.toString() : null);

  if (!targetRecipientId) {
    targetRecipientId = senderIdStr;
  }

  const notificationPayload = {
    company: req.user.company,
    type: 'COMPLAINT_REPLY',
    title: `Complaint Reply from ${req.user.name}`,
    message: `${complaint.subject}: ${message || 'Sent an attachment'}`,
    link: '/staff/complaints',
    data: { complaintId: complaint._id.toString(), type: 'COMPLAINT_REPLY' }
  };

  if (targetRecipientId) {
    console.log(`[COMPLAINT NOTIF REPLY] Sender: ${senderIdStr} | Target Recipient: ${targetRecipientId}`);
    notify({
      ...notificationPayload,
      recipient: targetRecipientId,
    }).catch(e => console.error('Complaint notification failed:', e));
  } else if (complaint.isGroup) {
    const companyUsers = await User.find({
      company: req.user.company,
      _id: { $ne: req.user._id },
      isActive: true,
    }).select('_id');
    let recipients = companyUsers.map(u => u._id.toString());
    if (recipients.length === 0) {
      recipients = [senderIdStr];
    }
    console.log(`[COMPLAINT NOTIF REPLY GROUP] Sender: ${senderIdStr} | Recipients: ${recipients.join(', ')}`);
    import('../services/notification.service.js').then(({ notifyMany }) => {
      notifyMany(recipients, notificationPayload).catch(e => console.error('Complaint notification failed:', e));
    });
  }

  res.status(201).json({ success: true, data: reply });
});
