import { io, type Socket } from "socket.io-client";
import { API_URL } from "./apiService";
import type { RoomState } from "@/types/room";

let socket: Socket | null = null;
let activeRoomId: string | null = null;

export function connectSocket(token: string): Socket {
  if (!socket) {
    socket = io(API_URL.replace(/\/api$/, ""), {
      autoConnect: false,
      reconnection: true,
      auth: { token },
    });
    socket.on("connect", () => {
      if (activeRoomId) socket?.emit("join_room", activeRoomId);
    });
  }
  socket.auth = { token };
  socket.connect();
  return socket;
}

export function joinRoomSocket(roomId: string): void {
  activeRoomId = roomId;
  socket?.emit("join_room", roomId);
}
export function leaveRoomSocket(roomId: string): void {
  if (activeRoomId === roomId) activeRoomId = null;
  socket?.emit("leave_room", roomId);
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
