const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "studentId is required"],
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "answered_by_ai", "answered_by_teacher"],
      default: "pending",
    },
    answer: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);