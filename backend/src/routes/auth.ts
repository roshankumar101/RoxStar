import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";

import { User } from "../models/User.js";
import { asyncHandler } from "../middleware/errors.js";
import {
  authUserId,
  clearAuthCookie,
  issueToken,
  requireAuth,
  setAuthCookie,
} from "../middleware/auth.js";

const router = Router();
const credentials = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
const publicUser = (user: {
  _id: unknown;
  name: string;
  email: string;
  avatar?: string | null;
}) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar ?? undefined,
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = credentials
      .extend({ name: z.string().trim().min(1).max(100) })
      .parse(req.body);
    const email = input.email.toLowerCase();
    const existing = await User.exists({ email });
    if (existing) {
      res.status(409).json({ error: "Email is already registered" });
      return;
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({ name: input.name, email, passwordHash });
    const token = issueToken(user._id);
    setAuthCookie(res, token);
    res.status(201).json({ user: publicUser(user), token });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = credentials.omit({ name: true }).parse(req.body);
    const user = await User.findOne({
      email: input.email.toLowerCase(),
    }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = issueToken(user._id);
    setAuthCookie(res, token);
    res.json({ user: publicUser(user), token });
  }),
);

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(authUserId(req));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ user: publicUser(user) });
  }),
);

export default router;
