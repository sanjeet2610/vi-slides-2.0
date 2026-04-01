const express = require("express");
const Question = require("../models/Question");
const { generateAnswer } = require("../services/geminiService");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

async function tryAutoAnswerQuestion(questionId, text) {
  try {
    const aiAnswer = await generateAnswer(text);
    const normalizedAnswer = (aiAnswer || "").trim();
    if (!normalizedAnswer) return;

    // Keep AI answers concise for students.
    const safeAnswer = normalizedAnswer
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 100)
      .join(" ");

    // Avoid overriding a teacher answer if status already changed.
    await Question.findOneAndUpdate(
      { _id: questionId, status: "pending" },
      {
        answer: safeAnswer,
        status: "answered_by_ai",
      },
      { runValidators: true }
    );
  } catch (aiError) {
    console.error("AI answer generation failed:", aiError.message);
  }
}

// POST /api/questions (submit question) - student only
router.post("/", protect, authorize("student"), async (req, res) => {
    try {
      const { text, isAnonymous = false } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ message: "Question text is required" });
      }
      // Save immediately so student does not wait for AI network latency.
      const question = await Question.create({
        text: text.trim(),
        studentId: req.user.userId,
        isAnonymous,
        status: "pending",
        answer: "",
      });

      // Fire and forget AI attempt; updates question later if successful.
      void tryAutoAnswerQuestion(question._id, question.text);

      return res.status(201).json({
        message: "Question submitted successfully",
        question,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to submit question",
        error: error.message,
      });
    }
  });

// GET /api/questions (teacher only)
router.get("/", protect, authorize("teacher"), async (_req, res) => {
  try {
    const questions = await Question.find()
      .populate("studentId", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ questions });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch questions", error: error.message });
  }
});

// GET /api/questions/my (student only)
router.get("/my", protect, authorize("student"), async (req, res) => {
  try {
    const myQuestions = await Question.find({ studentId: req.user.userId }).sort({ createdAt: -1 });

    return res.status(200).json({ questions: myQuestions });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch your questions", error: error.message });
  }
});

// PATCH /api/questions/:id/answer (teacher only)
router.patch("/:id/answer", protect, authorize("teacher"), async (req, res) => {
    try {
      const { answer } = req.body;
  
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
      return res.status(500).json({ message: "Failed to submit answer", error: error.message });
    }
  });

// DELETE /api/questions/:id (teacher only)
router.delete("/:id", protect, authorize("teacher"), async (req, res) => {
  try {
    const deleted = await Question.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Question not found" });
    }

    return res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete question", error: error.message });
  }
});

module.exports = router;