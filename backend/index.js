require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const questionRoutes = require("./routes/questionRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/questions", questionRoutes);
app.get("/", (_req, res) => {
  res.status(200).json({ message: "API is running" });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function startServer() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1); // exit if DB is not connected
  }
}

app.use("/api/auth", authRoutes);

startServer();