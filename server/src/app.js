import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import summaryRoutes from "./routes/summaryRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import studySessionRoutes from "./routes/studySessionRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";




const app = express();

// Core middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/summaries", summaryRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/study-sessions", studySessionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/goals", goalRoutes);
// Health check route (temporary, to verify server + env are working)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler (basic version for now)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  });
});

export default app;