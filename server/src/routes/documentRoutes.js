import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { handleUpload } from "../middleware/uploadMiddleware.js";
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} from "../controllers/documentController.js";

const router = express.Router();

router.post("/", protect, handleUpload, uploadDocument);
router.get("/", protect, getDocuments);
router.get("/:id", protect, getDocumentById);
router.patch("/:id", protect, updateDocument);
router.delete("/:id", protect, deleteDocument);

export default router;