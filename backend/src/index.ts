import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const port = Number(process.env.PORT ?? 3000);
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "*" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "roxstar-backend" });
});

app.get("/ready", (_req, res) => {
  res.json({ ready: true });
});

const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN ?? "*" },
});

io.on("connection", (socket) => {
  socket.emit("room_state", { status: "uninitialized" });
});

httpServer.listen(port, () => {
  console.log(`ROXSTAR backend listening on :${port}`);
});
