import crypto from "node:crypto";
import type { Server } from "socket.io";
import { Types } from "mongoose";
import { Room } from "../models/Room.js";
import { RoomMember } from "../models/RoomMember.js";
import { Spin } from "../models/Spin.js";
import { SpinEvent } from "../models/SpinEvent.js";
import { SpinParticipant } from "../models/SpinParticipant.js";

const timers = new Map<string, NodeJS.Timeout>();

async function event(
  spinId: Types.ObjectId,
  roomId: Types.ObjectId,
  type: "SPIN_STARTED" | "USER_ELIMINATED" | "WINNER_ANNOUNCED",
  io: Server,
  data: Record<string, unknown> = {},
  userId?: Types.ObjectId,
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
    { event: created, spinId, ...data },
  );
}

export async function runAuthoritativeSpin(
  spinId: string,
  io: Server,
): Promise<void> {
  const spin = await Spin.findByIdAndUpdate(
    spinId,
    { status: "RUNNING", startedAt: new Date() },
    { new: true },
  );
  if (!spin) return;
  await event(spin._id, spin.roomId, "SPIN_STARTED", io);
  const timer = setInterval(() => {
    void eliminateOne(spinId, io);
  }, 5000);
  timers.set(spinId, timer);
}

async function eliminateOne(spinId: string, io: Server): Promise<void> {
  const spin = await Spin.findOne({ _id: spinId, status: "RUNNING" });
  if (!spin) {
    stopTimer(spinId);
    return;
  }
  const active = await SpinParticipant.find({ spinId, status: "ACTIVE" });
  if (active.length <= 1) {
    if (active[0]) await finishSpin(spin, active[0].userId, io);
    else
      await Spin.findByIdAndUpdate(spin._id, {
        status: "ABORTED",
        completedAt: new Date(),
      });
    stopTimer(spinId);
    return;
  }
  const selected = active[crypto.randomInt(active.length)];
  const eliminatedCount = await SpinParticipant.countDocuments({
    spinId,
    status: "ELIMINATED",
  });
  await SpinParticipant.updateOne(
    { _id: selected._id, status: "ACTIVE" },
    {
      status: "ELIMINATED",
      eliminatedAt: new Date(),
      eliminationOrder: eliminatedCount + 1,
    },
  );
  await event(
    spin._id,
    spin.roomId,
    "USER_ELIMINATED",
    io,
    { eliminationOrder: eliminatedCount + 1 },
    selected.userId,
  );
  const remaining = await SpinParticipant.find({ spinId, status: "ACTIVE" });
  if (remaining.length === 1) {
    await finishSpin(spin, remaining[0].userId, io);
    stopTimer(spinId);
  }
}

async function finishSpin(
  spin: { _id: Types.ObjectId; roomId: Types.ObjectId },
  winnerId: Types.ObjectId,
  io: Server,
): Promise<void> {
  await SpinParticipant.updateOne(
    { spinId: spin._id, userId: winnerId },
    { status: "WINNER" },
  );
  await Spin.findByIdAndUpdate(spin._id, {
    status: "COMPLETED",
    winnerId,
    completedAt: new Date(),
  });
  await event(spin._id, spin.roomId, "WINNER_ANNOUNCED", io, {}, winnerId);
}

function stopTimer(spinId: string): void {
  const timer = timers.get(spinId);
  if (timer) {
    clearInterval(timer);
    timers.delete(spinId);
  }
}

export async function recoverRunningSpins(io: Server): Promise<void> {
  const running = await Spin.find({ status: "RUNNING" });
  for (const spin of running) {
    const members = await RoomMember.countDocuments({
      roomId: spin.roomId,
      isActive: true,
    });
    if (members < 2) {
      await Spin.findByIdAndUpdate(spin._id, {
        status: "ABORTED",
        completedAt: new Date(),
      });
      continue;
    }
    const timer = setInterval(() => {
      void eliminateOne(spin._id.toString(), io);
    }, 5000);
    timers.set(spin._id.toString(), timer);
  }
}

export async function abortSpinForRoom(roomId: Types.ObjectId): Promise<void> {
  const spins = await Spin.find({
    roomId,
    status: { $in: ["WAITING", "RUNNING"] },
  });
  for (const spin of spins) {
    await Spin.findByIdAndUpdate(spin._id, {
      status: "ABORTED",
      completedAt: new Date(),
    });
    stopTimer(spin._id.toString());
  }
}

export { event };
