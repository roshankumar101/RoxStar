import crypto from 'node:crypto';
import { Router } from 'express';
import type { Server } from 'socket.io';
import { Types } from 'mongoose';
import { z } from 'zod';

import { Room } from '../models/Room.js';
import { RoomMember } from '../models/RoomMember.js';
import { Draft } from '../models/Draft.js';
import { Spin } from '../models/Spin.js';
import { SpinParticipant } from '../models/SpinParticipant.js';
import { authUserId, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const roomInput = z.object({ name: z.string().trim().min(1).max(120) });
const draftInput = z.object({ name: z.string().trim().min(1).max(160), duration: z.number().int().min(0), effect: z.enum(['original', 'echo', 'reverb', 'pitch']).default('original'), fileUrl: z.string().url().optional(), draftId: z.string().optional() });

function makeCode(): string { return crypto.randomBytes(3).toString('hex').toUpperCase(); }
async function roomState(roomId: Types.ObjectId) {
  const room = await Room.findById(roomId).lean();
  if (!room) return null;
  const members = await RoomMember.find({ roomId, isActive: true }).populate('userId', 'name email avatar').lean();
  const drafts = await Draft.find({ roomId }).lean();
  const activeSpin = await Spin.findOne({ roomId, status: { $in: ['WAITING', 'RUNNING'] } }).lean();
  const spinParticipants = activeSpin ? await SpinParticipant.find({ spinId: activeSpin._id }).populate('userId', 'name avatar').lean() : [];
  return { room, members, drafts, activeSpin, spinParticipants };
}

export function createRoomRouter(io: Server) {
  const router = Router();
  router.use(requireAuth);

  router.post('/', asyncHandler(async (req, res) => {
    const { name } = roomInput.parse(req.body);
    const userId = authUserId(req);
    let code = makeCode();
    while (await Room.exists({ code })) code = makeCode();
    const room = await Room.create({ code, name, ownerId: userId, status: 'WAITING' });
    await RoomMember.create({ roomId: room._id, userId, role: 'OWNER' });
    res.status(201).json({ room });
  }));

  router.post('/:code/join', asyncHandler(async (req, res) => {
    const userId = authUserId(req);
    const room = await Room.findOne({ code: String(req.params.code).toUpperCase() });
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
    if (room.status === 'COMPLETED') { res.status(409).json({ error: 'Room is completed' }); return; }
    const member = await RoomMember.findOneAndUpdate({ roomId: room._id, userId }, { $set: { isActive: true, leftAt: undefined }, $setOnInsert: { role: 'MEMBER', joinedAt: new Date() } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    const state = await roomState(room._id);
    io.to(room._id.toString()).emit('user_joined', { userId: userId.toString(), member });
    res.json({ room, member, state });
  }));

  router.post('/:roomId/leave', asyncHandler(async (req, res) => {
    const userId = authUserId(req);
    const room = await Room.findById(req.params.roomId);
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
    await RoomMember.findOneAndUpdate({ roomId: room._id, userId, isActive: true }, { isActive: false, leftAt: new Date() });
    io.to(room._id.toString()).emit('user_left', { userId: userId.toString() });
    res.json({ ok: true });
  }));

  router.get('/:roomId', asyncHandler(async (req, res) => {
    const userId = authUserId(req);
    const member = await RoomMember.exists({ roomId: req.params.roomId, userId, isActive: true });
    if (!member) { res.status(403).json({ error: 'Join the room first' }); return; }
    const state = await roomState(new Types.ObjectId(String(req.params.roomId)));
    if (!state) { res.status(404).json({ error: 'Room not found' }); return; }
    res.json(state);
  }));

  router.post('/:roomId/drafts', asyncHandler(async (req, res) => {
    const userId = authUserId(req);
    const room = await Room.findById(req.params.roomId);
    const member = await RoomMember.exists({ roomId: req.params.roomId, userId, isActive: true });
    if (!room || !member) { res.status(403).json({ error: 'Active room membership required' }); return; }
    const input = draftInput.parse(req.body);
    let draft;
    if (input.draftId) {
      draft = await Draft.findOneAndUpdate({ _id: input.draftId, userId }, { roomId: room._id }, { new: true });
    } else {
      draft = await Draft.create({ userId, roomId: room._id, name: input.name, duration: input.duration, effect: input.effect, fileUrl: input.fileUrl });
    }
    if (!draft) { res.status(404).json({ error: 'Draft not found' }); return; }
    io.to(room._id.toString()).emit('draft_shared', { draftId: draft._id, userId, draftName: draft.name });
    res.status(201).json({ draft });
  }));

  return router;
}

export { roomState };
