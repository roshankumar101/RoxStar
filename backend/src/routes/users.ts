import { Router } from 'express';
import { Room } from '../models/Room.js';
import { RoomMember } from '../models/RoomMember.js';
import { Spin } from '../models/Spin.js';
import { SpinParticipant } from '../models/SpinParticipant.js';
import { authUserId, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errors.js';

const router = Router();
router.use(requireAuth);

router.get('/me/history', asyncHandler(async (req, res) => {
  const userId = authUserId(req);
  const memberships = await RoomMember.find({ userId }).sort({ joinedAt: -1 }).populate('roomId').lean();
  const roomIds = memberships.map((membership) => membership.roomId);
  const participations = await SpinParticipant.find({ userId }).sort({ joinedAt: -1 }).populate({ path: 'spinId', populate: { path: 'roomId' } }).lean();
  const createdRooms = await Room.find({ ownerId: userId }).sort({ createdAt: -1 }).lean();
  const wins = participations.filter((item) => item.status === 'WINNER');
  const eliminations = participations.filter((item) => item.status === 'ELIMINATED');
  res.json({
    statistics: { roomsJoined: memberships.length, spinsParticipated: participations.length, wins: wins.length, eliminations: eliminations.length },
    roomsJoined: memberships,
    roomsCreated: createdRooms,
    spinsParticipated: participations,
    spinsWon: wins,
    spinsEliminated: eliminations,
    roomCount: roomIds.length,
  });
}));

export default router;
