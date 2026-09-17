import { Router } from 'express';
import { z } from 'zod';
import { Draft } from '../models/Draft.js';
import { authUserId, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();
router.use(requireAuth);
const input = z.object({ name: z.string().trim().min(1).max(160), duration: z.number().int().min(0), effect: z.enum(['original', 'echo', 'reverb', 'pitch']).default('original'), fileUrl: z.string().url().optional() });

router.post('/', asyncHandler(async (req, res) => {
  const data = input.parse(req.body);
  const draft = await Draft.create({ ...data, userId: authUserId(req) });
  res.status(201).json({ draft });
}));

export default router;
