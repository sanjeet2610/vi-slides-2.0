export {};

declare global {
  namespace Express {
    interface AuthUser {
      userId: string;
      role: "student" | "teacher";
      email: string;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}
