import express, { type Request, type Response } from "express";
import type { Types } from "mongoose";
import Question from "../models/Question";
import { generateAnswer } from "../services/geminiService";
import { protect, authorize } from "../middleware/authMiddleware";

const router = express.Router();

async function tryAutoAnswerQuestion(
  questionId: Types.ObjectId,
  text: string
): Promise<void> {
  try {
    const aiAnswer = await generateAnswer(text);
    const normalizedAnswer = (aiAnswer || "").trim();
    if (!normalizedAnswer) return;

    const safeAnswer = normalizedAnswer
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 100)
      .join(" ");

    await Question.findOneAndUpdate(
      { _id: questionId, status: "pending" },
      {
        answer: safeAnswer,
        status: "answered_by_ai",
      },
      { runValidators: true }
    );
  } catch (aiError) {
    const message = aiError instanceof Error ? aiError.message : String(aiError);
    console.error("AI answer generation failed:", message);
  }
}

router.post("/", protect, authorize("student"), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { text, isAnonymous = false } = req.body as {
      text?: string;
      isAnonymous?: boolean;
    };

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Question text is required" });
    }

    const question = await Question.create({
      text: text.trim(),
      studentId: user.userId,
      isAnonymous,
      status: "pending",
      answer: "",
    });

    void tryAutoAnswerQuestion(question._id as Types.ObjectId, question.text);

    return res.status(201).json({
      message: "Question submitted successfully",
      question,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      message: "Failed to submit question",
      error: message,
    });
  }
});

router.get("/", protect, authorize("teacher"), async (_req: Request, res: Response) => {
  try {
    const questions = await Question.find()
      .populate("studentId", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ questions });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ message: "Failed to fetch questions", error: message });
  }
});

router.get("/my", protect, authorize("student"), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const myQuestions = await Question.find({ studentId: user.userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({ questions: myQuestions });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res
      .status(500)
      .json({ message: "Failed to fetch your questions", error: message });
  }
});

router.patch(
  "/:id/answer",
  protect,
  authorize("teacher"),
  async (req: Request, res: Response) => {
    try {
      const { answer } = req.body as { answer?: string };

      if (!answer || !answer.trim()) {
        return res.status(400).json({ message: "Answer is required" });
      }

      const updated = await Question.findByIdAndUpdate(
        req.params.id,
        {
          answer: answer.trim(),
          status: "answered_by_teacher",
        },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({ message: "Question not found" });
      }

      return res.status(200).json({
        message: "Answer submitted",
        question: updated,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res
        .status(500)
        .json({ message: "Failed to submit answer", error: message });
    }
  }
);

router.delete("/:id", protect, authorize("teacher"), async (req: Request, res: Response) => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Question not found" });
    }

    return res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ message: "Failed to delete question", error: message });
  }
});

export default router;
