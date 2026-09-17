export type RoomStatus = "WAITING" | "ACTIVE" | "COMPLETED";

export type Room = {
  _id: string;
  code: string;
  name: string;
  ownerId: string;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
};

export type RoomState = {
  room: Room;
  members: Array<{
    userId:
      | { _id: string; name: string; email: string; avatar?: string }
      | string;
    role: "OWNER" | "MEMBER";
    isActive: boolean;
  }>;
  drafts: Array<{
    _id: string;
    name: string;
    duration: number;
    effect: string;
    userId: string;
  }>;
  activeSpin?: import("./spin").Spin;
  spinParticipants?: import("./spin").SpinParticipant[];
};
