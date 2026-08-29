import { Shift } from '../models/index.js';
import { asyncHandler, ApiError } from '../utils/ApiError.js';
import { audit } from '../utils/audit.js';

export const listShifts = asyncHandler(async (req, res) => {
  const items = await Shift.find({ company: null }).sort('name');
  res.json({ success: true, data: items });
});

export const createShift = asyncHandler(async (req, res) => {
  const { name, workingDays, startTime, endTime, bufferTime } = req.body;
  if (await Shift.findOne({ name, company: null })) {
    throw ApiError.badRequest('System shift name already exists');
  }

  const item = await Shift.create({
    name, workingDays, startTime, endTime, bufferTime, company: null
  });

  audit({ req, action: 'CREATE_SHIFT', entity: 'Shift', entityId: item._id, meta: { name } });
  res.status(201).json({ success: true, data: item });
});

export const updateShift = asyncHandler(async (req, res) => {
  const item = await Shift.findOneAndUpdate(
    { _id: req.params.id, company: null },
    req.body,
    { new: true, runValidators: true }
  );
  if (!item) throw ApiError.notFound('Shift not found');
  audit({ req, action: 'UPDATE_SHIFT', entity: 'Shift', entityId: item._id });
  res.json({ success: true, data: item });
});

export const deleteShift = asyncHandler(async (req, res) => {
  const item = await Shift.findOneAndDelete({ _id: req.params.id, company: null });
  if (!item) throw ApiError.notFound('Shift not found');
  audit({ req, action: 'DELETE_SHIFT', entity: 'Shift', entityId: item._id });
  res.json({ success: true, message: 'Shift removed' });
});
