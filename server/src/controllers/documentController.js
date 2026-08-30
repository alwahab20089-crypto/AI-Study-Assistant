import path from "path";
import mongoose from "mongoose";
import Document from "../models/Document.js";
import Subject from "../models/Subject.js";
import { processDocument } from "../services/documentProcessingService.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  extractTextByType,
  isMeaningfulText,
  deleteFileIfExists,
} from "../services/documentService.js";
import { ALLOWED_EXTENSIONS } from "../middleware/uploadMiddleware.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Verifies a subjectId belongs to the requesting user and returns what to
// store on the document: a valid ObjectId, or null for "Uncategorized".
const resolveSubjectId = async (subjectId, userId) => {
  if (subjectId === undefined || subjectId === null || subjectId === "") {
    return null;
  }

  if (!isValidId(subjectId)) {
    const err = new Error("Invalid subject");
    err.statusCode = 400;
    throw err;
  }

  const subject = await Subject.findOne({ _id: subjectId, user: userId });

  if (!subject) {
    const err = new Error("Subject not found");
    err.statusCode = 404;
    throw err;
  }

  return subject._id;
};

// @desc   Upload a document, extract its text, create the record, and process it for AI chat
// @route  POST /api/documents
// @access Private
export const uploadDocument = asyncHandler(async (req, res) => {
  const { file } = req;
  const { title, subjectId } = req.body;

  const ext = path.extname(file.originalname).toLowerCase();
  const fileType = ALLOWED_EXTENSIONS[ext];

  let resolvedSubjectId;
  try {
    resolvedSubjectId = await resolveSubjectId(subjectId, req.user._id);
  } catch (err) {
    await deleteFileIfExists(file.path);
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }

  let extractedText;
  try {
    extractedText = await extractTextByType(file.path, fileType);
  } catch (error) {
    await deleteFileIfExists(file.path);
    return res.status(422).json({
      success: false,
      message:
        "We couldn't read this document. It may be corrupted or in an unsupported format.",
    });
  }

  if (!isMeaningfulText(extractedText)) {
    await deleteFileIfExists(file.path);
    return res.status(422).json({
      success: false,
      message:
        "We couldn't extract readable text from this document. Please upload a document containing selectable text.",
    });
  }

  const document = await Document.create({
    user: req.user._id,
    title: title?.trim() || file.originalname,
    originalFileName: file.originalname,
    fileType,
    fileSize: file.size,
    filePath: file.path,
    extractedText,
    subject: resolvedSubjectId,
    processingStatus: "processing",
  });

  // Chunk + embed + index the document for AI chat. Unchanged from before —
  // subjects are purely an organizational layer on top of this.
  await processDocument(document._id);

  const finalDocument = await Document.findById(document._id);

  res.status(201).json({
    success: true,
    document: {
      id: finalDocument._id,
      title: finalDocument.title,
      originalFileName: finalDocument.originalFileName,
      fileType: finalDocument.fileType,
      fileSize: finalDocument.fileSize,
      subject: finalDocument.subject,
      processingStatus: finalDocument.processingStatus,
      createdAt: finalDocument.createdAt,
    },
  });
});

// @desc   Get documents belonging to the authenticated user, with search/filter/sort
// @route  GET /api/documents?subjectId=&search=&fileType=&status=&sort=
// @access Private
export const getDocuments = asyncHandler(async (req, res) => {
  const { subjectId, search, fileType, status, sort } = req.query;

  const query = { user: req.user._id };

  if (subjectId === "uncategorized") {
    query.subject = null;
  } else if (subjectId && isValidId(subjectId)) {
    query.subject = subjectId;
  }

  if (search && search.trim()) {
    query.title = { $regex: search.trim(), $options: "i" };
  }

  if (fileType && ["pdf", "docx", "txt"].includes(fileType.toLowerCase())) {
    query.fileType = fileType.toLowerCase();
  }

  if (status && ["processing", "ready", "failed"].includes(status.toLowerCase())) {
    query.processingStatus = status.toLowerCase();
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "name-asc": { title: 1 },
    "name-desc": { title: -1 },
  };
  const sortOption = sortMap[sort] || sortMap.newest;

  const documents = await Document.find(query)
    .sort(sortOption)
    .select(
      "title originalFileName fileType fileSize subject processingStatus createdAt updatedAt"
    )
    .populate("subject", "name");

  res.status(200).json({
    success: true,
    documents,
  });
});

// @desc   Get a single document (with extracted text) belonging to the authenticated user
// @route  GET /api/documents/:id
// @access Private
export const getDocumentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  const document = await Document.findOne({ _id: id, user: req.user._id })
    .select(
      "title originalFileName fileType fileSize subject processingStatus extractedText createdAt updatedAt"
    )
    .populate("subject", "name");

  if (!document) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  res.status(200).json({
    success: true,
    document,
  });
});

// @desc   Rename a document and/or move it to a different subject
// @route  PATCH /api/documents/:id
// @access Private
export const updateDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, subjectId } = req.body;

  if (!isValidId(id)) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  const updates = {};

  if (title !== undefined) {
    if (!title.trim()) {
      return res.status(400).json({ success: false, message: "Title cannot be empty" });
    }
    updates.title = title.trim();
  }

  if (subjectId !== undefined) {
    try {
      updates.subject = await resolveSubjectId(subjectId, req.user._id);
    } catch (err) {
      return res.status(err.statusCode || 400).json({ success: false, message: err.message });
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: "Nothing to update" });
  }

  const document = await Document.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  )
    .select(
      "title originalFileName fileType fileSize subject processingStatus createdAt updatedAt"
    )
    .populate("subject", "name");

  if (!document) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  res.status(200).json({
    success: true,
    document,
  });
});

// @desc   Delete a document (file + record)
// @route  DELETE /api/documents/:id
// @access Private
export const deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  const document = await Document.findOne({ _id: id, user: req.user._id }).select("+filePath");

  if (!document) {
    return res.status(404).json({ success: false, message: "Document not found" });
  }

  await deleteFileIfExists(document.filePath);

  await document.deleteOne();

  res.status(200).json({
    success: true,
    message: "Document deleted successfully",
  });
});