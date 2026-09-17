import { Router } from 'express';
import { z } from 'zod';
import { Draft } from '../models/Draft.js';
import { authUserId, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();
router.use(requireAuth);
const input = z.object({ name: z.string().trim().min(1).max(160), duration: z.number().int().min(0), effect: z.enum(['original', 'echo', 'reverb', 'pitch']).default('original'), fileUrl: z.string().url().optional() });
const updateInput = input.partial();

router.get('/', asyncHandler(async (req, res) => {
  const drafts = await Draft.find({ userId: authUserId(req) }).sort({ createdAt: -1 }).lean();
  res.json({ drafts });
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = input.parse(req.body);
  const draft = await Draft.create({ ...data, userId: authUserId(req) });
  res.status(201).json({ draft });
}));

router.delete('/:draftId', asyncHandler(async (req, res) => {
  const deleted = await Draft.deleteOne({ _id: req.params.draftId, userId: authUserId(req) });
  if (!deleted.deletedCount) { res.status(404).json({ error: 'Draft not found' }); return; }
  res.json({ ok: true });
}));

router.patch('/:draftId', asyncHandler(async (req, res) => {
  const draft = await Draft.findOneAndUpdate({ _id: req.params.draftId, userId: authUserId(req) }, { $set: updateInput.parse(req.body) }, { new: true, runValidators: true });
  if (!draft) { res.status(404).json({ error: 'Draft not found' }); return; }
  res.json({ draft });
}));

export default router;
