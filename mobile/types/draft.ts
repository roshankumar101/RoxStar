export type DraftEffect = "original" | "echo" | "reverb" | "pitch";

export type Draft = {
  _id: string;
  userId: string;
  roomId?: string;
  name: string;
  duration: number;
  effect: DraftEffect;
  fileUrl?: string;
  createdAt: string;
  updatedAt: string;
};
