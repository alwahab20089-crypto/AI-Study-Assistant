import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController.js";

const router = express.Router();

router.post("/", protect, createSubject);
router.get("/", protect, getSubjects);
router.get("/:subjectId", protect, getSubjectById);
router.patch("/:subjectId", protect, updateSubject);
router.delete("/:subjectId", protect, deleteSubject);

export default router;