import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: "Invalid request", details: error.issues });
    return;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    res.status(409).json({ error: "Resource already exists" });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}
