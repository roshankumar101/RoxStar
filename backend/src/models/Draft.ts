import { Schema, model } from "mongoose";

const draftSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    duration: { type: Number, required: true, min: 0 },
    effect: {
      type: String,
      enum: ["original", "echo", "reverb", "pitch"],
      default: "original",
    },
    fileUrl: { type: String },
  },
  { timestamps: true },
);

export const Draft = model("Draft", draftSchema);
