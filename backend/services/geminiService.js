const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing in environment variables");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

async function generateAnswer(question) {
  try {
    if (!question || !question.trim()) {
      throw new Error("Question is required");
    }

    const result = await model.generateContent(question.trim());
    const response = await result.response;
    const text = response.text();

    return text || "I could not generate an answer right now.";
  } catch (error) {
    console.error("Gemini generation failed:", error.message);
    throw new Error("Failed to generate AI answer");
  }
}

module.exports = { generateAnswer };