import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema(
  {
    senderType: { type: String, enum: ['ADMIN', 'USER'], required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    attachments: [{
      name: String,
      url: String,
      mimeType: String,
      size: Number
    }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketActivitySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    oldStatus: String,
    newStatus: String,
    oldPriority: String,
    newPriority: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    meta: mongoose.Schema.Types.Mixed,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },

    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdByType: { type: String, enum: ['COMPANY_OWNER', 'COMPANY_MANAGER', 'STAFF'], required: true },

    subject: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'TECHNICAL_ISSUE', 'ACCOUNT', 'BILLING', 'ATTENDANCE', 'GPS_LOCATION',
        'SALES', 'INVENTORY', 'PAYROLL', 'FEATURE_REQUEST', 'OTHER'
      ],
      required: true,
      index: true,
    },

    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },

    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },

    description: { type: String, required: true },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

    messages: [ticketMessageSchema],

    internalNotes: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    activity: [ticketActivitySchema],

    lastActivityAt: { type: Date, default: Date.now },
    resolvedAt: Date,
    closedAt: Date,
  },
  { timestamps: true }
);

supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ ticketNumber: 'text', subject: 'text' });

export default mongoose.model('SupportTicket', supportTicketSchema);
