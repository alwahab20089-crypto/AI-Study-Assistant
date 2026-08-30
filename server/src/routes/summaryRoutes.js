import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { generateSummary, getSummaries, deleteSummary } from "../controllers/summaryController.js";

const router = express.Router();

router.post("/", protect, generateSummary);
router.get("/:documentId", protect, getSummaries);
router.delete("/:summaryId", protect, deleteSummary);

export default router;