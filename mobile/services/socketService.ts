import { io, type Socket } from "socket.io-client";
import { API_URL } from "./apiService";
import type { RoomState } from "@/types/room";

let socket: Socket | null = null;
const activeRooms = new Map<string, number>();
let authenticatedToken: string | null = null;

export function connectSocket(token: string): Socket {
  if (!socket) {
    socket = io(API_URL.replace(/\/api$/, ""), {
      autoConnect: false,
      reconnection: true,
      auth: { token },
    });
    socket.on("connect", () => {
      activeRooms.forEach((_references, roomId) => {
        socket?.emit("join_room", roomId);
      });
    });
  }
  if (socket.connected && authenticatedToken !== token) {
    socket.disconnect();
  }
  authenticatedToken = token;
  socket.auth = { token };
  socket.connect();

  return socket;
}

export function disconnectSocket(): void {
  activeRooms.clear();
  authenticatedToken = null;
  socket?.disconnect();
  socket?.removeAllListeners();
  socket = null;
}

export function joinRoomSocket(roomId: string): void {
  const references = activeRooms.get(roomId) ?? 0;
  activeRooms.set(roomId, references + 1);
  if (references === 0 && socket?.connected) socket.emit("join_room", roomId);
}
export function leaveRoomSocket(roomId: string): void {
  const references = activeRooms.get(roomId) ?? 0;
  if (references > 1) {
    activeRooms.set(roomId, references - 1);
    return;
  }
  activeRooms.delete(roomId);
  if (references === 1) socket?.emit("leave_room", roomId);
}

export type RoomEventHandlers = {
  room_state?: (state: RoomState) => void;
  user_joined?: (payload: unknown) => void;
  user_left?: (payload: unknown) => void;
  draft_shared?: (payload: unknown) => void;
  spin_started?: (payload: unknown) => void;
  user_eliminated?: (payload: unknown) => void;
  winner_announced?: (payload: unknown) => void;
};

export function subscribeRoom(handlers: RoomEventHandlers): () => void {
  if (!socket) return () => undefined;
  (
    Object.entries(handlers) as Array<
      [
        keyof RoomEventHandlers,
        NonNullable<RoomEventHandlers[keyof RoomEventHandlers]>,
      ]
    >
  ).forEach(([event, handler]) => socket?.on(event, handler));
  return () => {
    (
      Object.entries(handlers) as Array<
        [
          keyof RoomEventHandlers,
          NonNullable<RoomEventHandlers[keyof RoomEventHandlers]>,
        ]
      >
    ).forEach(([event, handler]) => socket?.off(event, handler));
  };
}
