import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      authUserId?: Types.ObjectId;
    }
  }
}

export {};
