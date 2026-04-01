import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

const JWT_SECRET = process.env.JWT_SECRET;

export function protect(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized: token missing" });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!JWT_SECRET) {
      res.status(500).json({ message: "Server configuration error" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string") {
      res.status(401).json({ message: "Unauthorized: invalid token" });
      return;
    }

    const userId = decoded.userId as string | undefined;
    const role = decoded.role as "student" | "teacher" | undefined;
    const email = decoded.email as string | undefined;

    if (!userId || !role || !email) {
      res.status(401).json({ message: "Unauthorized: invalid token" });
      return;
    }

    req.user = { userId, role, email };
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized: invalid token" });
  }
}

export function authorize(...roles: ("student" | "teacher")[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden: insufficient role" });
      return;
    }
    next();
  };
}
