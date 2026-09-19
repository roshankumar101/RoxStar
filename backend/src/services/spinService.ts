import crypto from "node:crypto";
import type { Server } from "socket.io";
import { Types } from "mongoose";
import { Room } from "../models/Room.js";
import { Spin } from "../models/Spin.js";
import { SpinEvent } from "../models/SpinEvent.js";
import { SpinParticipant } from "../models/SpinParticipant.js";

const roundDurationMs = 5000;
const timers = new Map<string, NodeJS.Timeout>();
const eliminationsInFlight = new Set<string>();

function stopTimer(spinId: string): void {
  const timer = timers.get(spinId);
  if (timer) {
    clearTimeout(timer);
    timers.delete(spinId);
  }
}

async function scheduleNextElimination(
  spinId: string,
  io: Server,
): Promise<void> {
  stopTimer(spinId);
  let spin = await Spin.findOne({ _id: spinId, status: "RUNNING" })
    .select("nextEliminationAt")
    .lean();
  if (!spin) return;

  if (!spin.nextEliminationAt) {
    const nextEliminationAt = new Date(Date.now() + roundDurationMs);
    spin = await Spin.findOneAndUpdate(
      {
        _id: spinId,
        status: "RUNNING",
        nextEliminationAt: { $exists: false },
      },
      { $set: { nextEliminationAt } },
      { new: true },
    )
      .select("nextEliminationAt")
      .lean();
    if (!spin) {
      spin = await Spin.findOne({ _id: spinId, status: "RUNNING" })
        .select("nextEliminationAt")
        .lean();
    }
  }
  if (!spin?.nextEliminationAt) return;

  const delay = Math.max(0, spin.nextEliminationAt.getTime() - Date.now());
  const timer = setTimeout(() => {
    timers.delete(spinId);
    if (eliminationsInFlight.has(spinId)) return;
    eliminationsInFlight.add(spinId);
    void eliminateOne(spinId, io)
      .catch((error) => console.error(`Spin ${spinId} tick failed`, error))
      .finally(() => {
        eliminationsInFlight.delete(spinId);
        void scheduleNextElimination(spinId, io);
      });
  }, delay);
  timers.set(spinId, timer);
}

async function event(
  spinId: Types.ObjectId,
  roomId: Types.ObjectId,
  type: "SPIN_STARTED" | "USER_ELIMINATED" | "WINNER_ANNOUNCED",
  io: Server,
  data: Record<string, unknown> = {},
  userId?: Types.ObjectId,
  broadcastData: Record<string, unknown> = {},
) {
  const created = await SpinEvent.create({
    spinId,
    roomId,
    type,
    data,
    userId,
  });
  io.to(String(roomId)).emit(
    type === "SPIN_STARTED"
      ? "spin_started"
      : type === "USER_ELIMINATED"
        ? "user_eliminated"
        : "winner_announced",
    {
      event: created,
      spinId,
      roomId,
      userId,
      ...data,
      ...broadcastData,
    },
  );
}

async function participantSnapshot(spinId: Types.ObjectId) {
  return SpinParticipant.find({ spinId })
    .sort({ eliminationOrder: 1, joinedAt: 1 })
    .populate("userId", "name avatar")
    .lean();
}

export async function runAuthoritativeSpin(
  spinId: string,
  io: Server,
): Promise<void> {
  const startedAt = new Date();
  const nextEliminationAt = new Date(startedAt.getTime() + roundDurationMs);
  const spin = await Spin.findOneAndUpdate(
    { _id: spinId, status: "WAITING" },
    {
      $set: {
        status: "RUNNING",
        startedAt,
        round: 1,
        nextEliminationAt,
      },
    },
    { new: true },
  );
  if (spin) {
    await Room.findByIdAndUpdate(spin.roomId, { status: "ACTIVE" });
    const participants = await participantSnapshot(spin._id);
    await event(spin._id, spin.roomId, "SPIN_STARTED", io, {
      round: 1,
      nextEliminationAt,
    }, undefined, { participants });
  }
  await scheduleNextElimination(spinId, io);
}

async function eliminateOne(spinId: string, io: Server): Promise<void> {
  const now = new Date();
  const nextEliminationAt = new Date(now.getTime() + roundDurationMs);
  const spin = await Spin.findOneAndUpdate(
    {
      _id: spinId,
      status: "RUNNING",
      nextEliminationAt: { $lte: now },
    },
    { $set: { nextEliminationAt } },
  );
  if (!spin) return;

  const active = await SpinParticipant.find({ spinId, status: "ACTIVE" });
  if (active.length <= 1) {
    if (active[0]) await finishSpin(spin, active[0].userId, io);
    else await abortSpin(spin._id, spin.roomId);
    return;
  }

  const round = spin.round ?? 1;
  const selected = active[crypto.randomInt(active.length)];
  const eliminatedCount = await SpinParticipant.countDocuments({
    spinId,
    status: "ELIMINATED",
  });
  const update = await SpinParticipant.updateOne(
    { _id: selected._id, status: "ACTIVE" },
    {
      status: "ELIMINATED",
      eliminatedAt: new Date(),
      eliminationOrder: eliminatedCount + 1,
    },
  );
  if (update.modifiedCount === 1) {
    await Spin.updateOne(
      { _id: spin._id, status: "RUNNING" },
      { $inc: { round: 1 } },
    );
    const participants = await participantSnapshot(spin._id);
    await event(
      spin._id,
      spin.roomId,
      "USER_ELIMINATED",
      io,
      {
        round,
        eliminationOrder: eliminatedCount + 1,
        remainingCount: active.length - 1,
        nextEliminationAt,
      },
      selected.userId,
      { participants },
    );
  }

  const remaining = await SpinParticipant.find({ spinId, status: "ACTIVE" });
  if (remaining.length === 1) {
    await finishSpin(spin, remaining[0].userId, io);
  } else if (remaining.length === 0) {
    await abortSpin(spin._id, spin.roomId);
  }
}

async function finishSpin(
  spin: { _id: Types.ObjectId; roomId: Types.ObjectId },
  winnerId: Types.ObjectId,
  io: Server,
): Promise<void> {
  const winner = await SpinParticipant.findOneAndUpdate(
    {
      spinId: spin._id,
      userId: winnerId,
      status: { $in: ["ACTIVE", "WINNER"] },
    },
    { $set: { status: "WINNER" } },
    { new: true },
  );
  if (!winner) return;
  const completed = await Spin.findOneAndUpdate(
    { _id: spin._id, status: "RUNNING" },
    {
      $set: { status: "COMPLETED", winnerId, completedAt: new Date() },
      $unset: { nextEliminationAt: 1 },
    },
    { new: true },
  );
  if (!completed) return;
  await Room.findByIdAndUpdate(spin.roomId, { status: "COMPLETED" });
  const participants = await participantSnapshot(spin._id);
  await event(
    spin._id,
    spin.roomId,
    "WINNER_ANNOUNCED",
    io,
    {},
    winnerId,
    { participants },
  );
  stopTimer(spin._id.toString());
}

async function abortSpin(
  spinId: Types.ObjectId,
  roomId: Types.ObjectId,
): Promise<void> {
  const aborted = await Spin.findOneAndUpdate(
    { _id: spinId, status: { $in: ["WAITING", "RUNNING"] } },
    {
      $set: { status: "ABORTED", completedAt: new Date() },
      $unset: { nextEliminationAt: 1 },
    },
  );
  if (aborted) {
    await Room.findByIdAndUpdate(roomId, { status: "WAITING" });
    stopTimer(spinId.toString());
  }
}

export async function recoverRunningSpins(io: Server): Promise<void> {
  const recoverable = await Spin.find({
    status: { $in: ["WAITING", "RUNNING"] },
  });
  for (const spin of recoverable) {
    const active = await SpinParticipant.find({
      spinId: spin._id,
      status: "ACTIVE",
    });
    if (spin.status === "WAITING") {
      if (active.length < 3) await abortSpin(spin._id, spin.roomId);
      else await runAuthoritativeSpin(spin._id.toString(), io);
      continue;
    }
    const existingWinner = await SpinParticipant.findOne({
      spinId: spin._id,
      status: "WINNER",
    });
    if (existingWinner) {
      await finishSpin(spin, existingWinner.userId, io);
    } else if (active.length === 1) {
      await finishSpin(spin, active[0].userId, io);
    } else if (active.length === 0) {
      await abortSpin(spin._id, spin.roomId);
    } else {
      await scheduleNextElimination(spin._id.toString(), io);
    }
  }
}

export async function withdrawParticipantFromSpin(
  roomId: Types.ObjectId,
  userId: Types.ObjectId,
  io: Server,
): Promise<void> {
  const spin = await Spin.findOne({ roomId, status: "RUNNING" });
  if (!spin) return;
  const withdrawn = await SpinParticipant.updateOne(
    { spinId: spin._id, userId, status: "ACTIVE" },
    { $set: { status: "WITHDRAWN", withdrawnAt: new Date() } },
  );
  if (withdrawn.modifiedCount !== 1) return;

  const remaining = await SpinParticipant.find({
    spinId: spin._id,
    status: "ACTIVE",
  });
  if (remaining.length === 1) {
    await finishSpin(spin, remaining[0].userId, io);
  } else if (remaining.length === 0) {
    await abortSpin(spin._id, spin.roomId);
  }
}

export async function abortSpinForRoom(roomId: Types.ObjectId): Promise<void> {
  const spins = await Spin.find({
    roomId,
    status: { $in: ["WAITING", "RUNNING"] },
  });
  for (const spin of spins) {
    await abortSpin(spin._id, spin.roomId);
  }
}

export { event };
