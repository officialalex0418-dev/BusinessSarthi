import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters']
  },
  mediaType: {
    type: String,
    required: true,
    enum: ['image', 'video'],
    default: 'image'
  },
  mediaUrl: {
    type: String,
    required: [true, 'Media URL is required']
  },
  url: {
    type: String,
    required: [true, 'Product URL is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
productSchema.index({ isActive: 1, displayOrder: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
