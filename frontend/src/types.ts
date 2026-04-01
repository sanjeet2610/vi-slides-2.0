export type Role = "student" | "teacher";

export type QuestionStatus = "pending" | "answered_by_ai" | "answered_by_teacher";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Question {
  _id: string;
  text: string;
  isAnonymous: boolean;
  status: QuestionStatus;
  answer: string;
  createdAt: string;
  studentId?: { name?: string; email?: string; role?: string };
}
