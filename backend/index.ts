import "dotenv/config";
import express, { type Request, type Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import questionRoutes from "./routes/questionRoutes";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/questions", questionRoutes);
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "API is running" });
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function startServer(): Promise<void> {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    app.listen(Number(PORT), () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to connect to MongoDB:", message);
    process.exit(1);
  }
}

void startServer();
