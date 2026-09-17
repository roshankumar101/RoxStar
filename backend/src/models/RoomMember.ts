import { Schema, model } from "mongoose";

const roomMemberSchema = new Schema({
  roomId: {
    type: Schema.Types.ObjectId,
    ref: "Room",
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  role: { type: String, enum: ["OWNER", "MEMBER"], required: true },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date },
  isActive: { type: Boolean, default: true, index: true },
});
roomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });

export const RoomMember = model("RoomMember", roomMemberSchema);
