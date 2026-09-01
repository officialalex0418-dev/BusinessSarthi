import { Product } from '../models/index.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { getPagination, paginatedResponse } from '../utils/pagination.js';
import { audit } from '../utils/audit.js';
import { uploadFile, deleteFile } from '../services/storage.service.js';

/** GET /admin/products (Super Admin) */
export const listAdminProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.isActive) filter.isActive = req.query.isActive === 'true';
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };

  const [items, total] = await Promise.all([
    Product.find(filter).sort('displayOrder createdAt').skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, data: paginatedResponse(items, total, page, limit) });
});

/** POST /admin/products (Super Admin) */
export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, mediaType, media, url, isActive, displayOrder } = req.body;

  let mediaUrl = media;
  if (media && media.startsWith('data:')) {
    // Determine folder and content type based on mediaType
    const folder = mediaType === 'video' ? 'product-videos' : 'products';
    const contentType = media.split(';')[0].split(':')[1];
    mediaUrl = await uploadFile(media, folder, contentType);
  }

  const product = await Product.create({
    name, description, mediaType, mediaUrl, url, isActive, displayOrder,
    createdBy: req.user._id
  });

  audit({ req, action: 'CREATE_PRODUCT', entity: 'Product', entityId: product._id, meta: { name } });
  res.status(201).json({ success: true, data: { product } });
});

/** GET /admin/products/:id (Super Admin) */
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  res.json({ success: true, data: { product } });
});

/** PATCH /admin/products/:id (Super Admin) */
export const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, mediaType, media, url, isActive, displayOrder } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  const updates = { name, description, mediaType, url, isActive, displayOrder, updatedBy: req.user._id };
  Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

  if (media && media.startsWith('data:')) {
    // Delete old file if it exists and we're replacing it
    if (product.mediaUrl) {
       await deleteFile(product.mediaUrl);
    }
    const folder = (mediaType || product.mediaType) === 'video' ? 'product-videos' : 'products';
    const contentType = media.split(';')[0].split(':')[1];
    updates.mediaUrl = await uploadFile(media, folder, contentType);
  }

  const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true, runValidators: true,
  });

  audit({ req, action: 'UPDATE_PRODUCT', entity: 'Product', entityId: product._id, meta: { name: updatedProduct.name } });
  res.json({ success: true, data: { product: updatedProduct } });
});

/** DELETE /admin/products/:id (Super Admin) */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');

  // Delete associated media file
  if (product.mediaUrl) {
    await deleteFile(product.mediaUrl);
  }

  await Product.findByIdAndDelete(req.params.id);
  audit({ req, action: 'DELETE_PRODUCT', entity: 'Product', entityId: product._id, meta: { name: product.name } });
  res.json({ success: true, message: 'Product permanently removed' });
});

/** GET /public/products (Public) */
export const listPublicProducts = asyncHandler(async (req, res) => {
  // Return only active products, limited set of fields, sorted by displayOrder
  const products = await Product.find({ isActive: true })
    .select('name description mediaType mediaUrl url displayOrder')
    .sort('displayOrder createdAt');

  res.json({ success: true, data: products });
});
