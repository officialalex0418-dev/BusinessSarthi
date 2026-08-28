import mongoose from 'mongoose';

const inquiryReplySchema = new mongoose.Schema(
  {
    senderType: { type: String, enum: ['ADMIN', 'VISITOR'], required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If ADMIN
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const inquiryActivitySchema = new mongoose.Schema(
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

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    companyName: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },

    source: { type: String, default: 'WEBSITE', index: true },

    status: {
      type: String,
      enum: ['NEW', 'IN_PROGRESS', 'PROPOSAL_SENT', 'NEGOTIATION', 'PENDING_SIGN', 'ONBOARDED', 'ARCHIVED'],
      default: 'NEW',
      index: true,
    },

    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

    replies: [inquiryReplySchema],
    internalNotes: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    activity: [inquiryActivitySchema],

    lastRepliedAt: Date,
    resolvedAt: Date,
  },
  { timestamps: true }
);

inquirySchema.index({ createdAt: -1 });
inquirySchema.index({ name: 'text', email: 'text', companyName: 'text', subject: 'text' });

export default mongoose.model('Inquiry', inquirySchema);
