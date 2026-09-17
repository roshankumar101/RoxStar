import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import { Types } from "mongoose";

import { connectDatabase, isDatabaseReady } from "./config/database.js";
import authRoutes from "./routes/auth.js";
import { createRoomRouter, roomState } from "./routes/rooms.js";
import { createSpinRouter } from "./routes/spins.js";
import userRoutes from "./routes/users.js";
import draftRoutes from "./routes/drafts.js";
import { RoomMember } from "./models/RoomMember.js";
import { errorHandler } from "./middleware/errors.js";
import { recoverRunningSpins } from "./services/spinService.js";

const port = Number(process.env.PORT ?? 3000);
const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN ?? "*";
app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "roxstar-backend" });
});

app.get("/api/readiness", (_req, res) => {
  if (!isDatabaseReady()) { res.status(503).json({ ready: false, database: "disconnected" }); return; }
  res.json({ ready: true, database: "connected" });
});

const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: clientOrigin, credentials: true },
  connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000, skipMiddlewares: false },
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", createRoomRouter(io));
app.use("/api", createSpinRouter(io));
app.use("/api/users", userRoutes);
app.use("/api/drafts", draftRoutes);
app.use(errorHandler);

function socketToken(socket: Socket): string | undefined {
  const authToken = typeof socket.handshake.auth?.token === "string" ? socket.handshake.auth.token : undefined;
  if (authToken) return authToken;
  const cookie = socket.handshake.headers.cookie?.split(";").find((value) => value.trim().startsWith("roxstar_token="));
  return cookie?.trim().slice("roxstar_token=".length);
}

io.use((socket, next) => {
  try {
    const token = socketToken(socket);
    const secret = process.env.JWT_SECRET;
    if (!token || !secret) return next(new Error("Authentication required"));
    const payload = jwt.verify(token, secret) as { sub?: string };
    if (!payload.sub) return next(new Error("Invalid token"));
    socket.data.userId = payload.sub;
    next();
  } catch { next(new Error("Invalid or expired token")); }
});

io.on("connection", (socket) => {
  const joinRoom = async (roomId: string) => {
    const member = await RoomMember.exists({ roomId, userId: socket.data.userId, isActive: true });
    if (!member) { socket.emit("room_error", { error: "Active room membership required" }); return; }
    await socket.join(roomId);
    if (!Types.ObjectId.isValid(roomId)) { socket.emit("room_error", { error: "Invalid room id" }); return; }
    const state = await roomState(new Types.ObjectId(roomId));
    socket.emit("room_state", state ?? { status: "not_found" });
  };

  socket.on("join_room", (roomId: string) => { void joinRoom(roomId); });
  if (typeof socket.handshake.auth?.roomId === "string") void joinRoom(socket.handshake.auth.roomId);

  socket.on("leave_room", async (roomId: string) => { await socket.leave(roomId); });
});

async function start(): Promise<void> {
  await connectDatabase();
  await recoverRunningSpins(io);
  httpServer.listen(port, () => console.log(`ROXSTAR backend listening on :${port}`));
}

void start().catch((error) => { console.error("ROXSTAR backend failed to start", error); process.exitCode = 1; });
