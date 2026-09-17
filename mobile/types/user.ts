export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

export type UserHistory = {
  statistics: {
    roomsJoined: number;
    spinsParticipated: number;
    wins: number;
    eliminations: number;
  };
  roomsJoined: Array<{
    roomId: import("./room").Room;
    role: "OWNER" | "MEMBER";
    joinedAt: string;
    isActive: boolean;
  }>;
  roomsCreated: import("./room").Room[];
  spinsParticipated: Array<{
    spinId: import("./spin").Spin & { roomId: import("./room").Room };
    status: import("./spin").SpinParticipantStatus;
    eliminationOrder?: number;
    joinedAt: string;
  }>;
  spinsWon: UserHistory["spinsParticipated"];
  spinsEliminated: UserHistory["spinsParticipated"];
};
