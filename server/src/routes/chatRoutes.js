import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sendChatMessage, getChatHistory } from "../controllers/chatController.js";

const router = express.Router();

router.post("/", protect, sendChatMessage);
router.get("/:documentId", protect, getChatHistory);

export default router;