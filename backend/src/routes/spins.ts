import { Router } from "express";
import type { Server } from "socket.io";
import { Spin } from "../models/Spin.js";
import { SpinParticipant } from "../models/SpinParticipant.js";
import { Room } from "../models/Room.js";
import { RoomMember } from "../models/RoomMember.js";
import { authUserId, requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errors.js";
import { runAuthoritativeSpin } from "../services/spinService.js";

export function createSpinRouter(io: Server) {
  const router = Router();
  router.use(requireAuth);

  router.post(
    "/rooms/:roomId/spin",
    asyncHandler(async (req, res) => {
      const userId = authUserId(req);
      const room = await Room.findOne({
        _id: req.params.roomId,
        ownerId: userId,
      });
      if (!room) {
        res.status(403).json({ error: "Only the room owner can start a spin" });
        return;
      }
      const members = await RoomMember.find({
        roomId: room._id,
        isActive: true,
      });
      if (members.length < 3) {
        res
          .status(409)
          .json({ error: "At least 3 active participants are required" });
        return;
      }
      if (members.length > 20) {
        res
          .status(409)
          .json({ error: "A spin supports at most 20 participants" });
        return;
      }
      const existing = await Spin.findOne({
        roomId: room._id,
        status: { $in: ["WAITING", "RUNNING"] },
      });
      if (existing) {
        res
          .status(409)
          .json({ error: "A spin is already active", spinId: existing._id });
        return;
      }
      const spin = await Spin.create({
        roomId: room._id,
        startedBy: userId,
        status: "WAITING",
      });
      await SpinParticipant.insertMany(
        members.map((member) => ({
          spinId: spin._id,
          userId: member.userId,
          status: "ACTIVE",
        })),
      );
      void runAuthoritativeSpin(spin._id.toString(), io);
      res.status(201).json({ spin });
    }),
  );

  router.get(
    "/:spinId",
    asyncHandler(async (req, res) => {
      const userId = authUserId(req);
      const spin = await Spin.findById(req.params.spinId).lean();
      if (!spin) {
        res.status(404).json({ error: "Spin not found" });
        return;
      }
      const member = await RoomMember.exists({ roomId: spin.roomId, userId });
      if (!member) {
        res.status(403).json({ error: "Room membership required" });
        return;
      }
      const participants = await SpinParticipant.find({ spinId: spin._id })
        .populate("userId", "name avatar")
        .lean();
      res.json({ spin, participants });
    }),
  );

  router.get(
    "/:spinId/result",
    asyncHandler(async (req, res) => {
      const userId = authUserId(req);
      const spin = await Spin.findById(req.params.spinId).lean();
      if (!spin) {
        res.status(404).json({ error: "Spin not found" });
        return;
      }
      const member = await RoomMember.exists({ roomId: spin.roomId, userId });
      if (!member) {
        res.status(403).json({ error: "Room membership required" });
        return;
      }
      const participants = await SpinParticipant.find({ spinId: spin._id })
        .sort({ eliminationOrder: 1 })
        .populate("userId", "name avatar")
        .lean();
      res.json({ status: spin.status, winnerId: spin.winnerId, participants });
    }),
  );

  return router;
}
