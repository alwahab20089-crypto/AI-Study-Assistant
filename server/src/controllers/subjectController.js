import mongoose from "mongoose";
import Subject from "../models/Subject.js";
import Document from "../models/Document.js";
import asyncHandler from "../utils/asyncHandler.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc   Create a subject
// @route  POST /api/subjects
// @access Private
export const createSubject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Subject name is required" });
  }

  const trimmedName = name.trim();

  const existing = await Subject.findOne({ user: req.user._id, name: trimmedName }).collation({
    locale: "en",
    strength: 2,
  });

  if (existing) {
    return res
      .status(409)
      .json({ success: false, message: "You already have a subject with this name" });
  }

  const subject = await Subject.create({
    user: req.user._id,
    name: trimmedName,
    description: description?.trim() || "",
  });

  res.status(201).json({
    success: true,
    subject: {
      id: subject._id,
      name: subject.name,
      description: subject.description,
      createdAt: subject.createdAt,
    },
  });
});

// @desc   Get all subjects for the authenticated user, with document counts
// @route  GET /api/subjects
// @access Private
export const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ user: req.user._id }).sort({ name: 1 }).lean();

  const counts = await Document.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: "$subject", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    counts.map((c) => [c._id ? c._id.toString() : "uncategorized", c.count])
  );

  res.status(200).json({
    success: true,
    subjects: subjects.map((s) => ({
      id: s._id,
      name: s.name,
      description: s.description,
      documentCount: countMap.get(s._id.toString()) || 0,
      createdAt: s.createdAt,
    })),
    uncategorizedCount: countMap.get("uncategorized") || 0,
  });
});

// @desc   Get one subject with its documents
// @route  GET /api/subjects/:subjectId
// @access Private
export const getSubjectById = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;

  if (!isValidId(subjectId)) {
    return res.status(404).json({ success: false, message: "Subject not found" });
  }

  const subject = await Subject.findOne({ _id: subjectId, user: req.user._id });

  if (!subject) {
    return res.status(404).json({ success: false, message: "Subject not found" });
  }

  const documents = await Document.find({ user: req.user._id, subject: subject._id })
    .sort({ createdAt: -1 })
    .select("title originalFileName fileType fileSize processingStatus createdAt updatedAt");

  res.status(200).json({
    success: true,
    subject: {
      id: subject._id,
      name: subject.name,
      description: subject.description,
      createdAt: subject.createdAt,
    },
    documents,
  });
});

// @desc   Update a subject's name/description
// @route  PATCH /api/subjects/:subjectId
// @access Private
export const updateSubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const { name, description } = req.body;

  if (!isValidId(subjectId)) {
    return res.status(404).json({ success: false, message: "Subject not found" });
  }

  const updates = {};

  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({ success: false, message: "Subject name cannot be empty" });
    }

    const duplicate = await Subject.findOne({
      user: req.user._id,
      name: name.trim(),
      _id: { $ne: subjectId },
    }).collation({ locale: "en", strength: 2 });

    if (duplicate) {
      return res
        .status(409)
        .json({ success: false, message: "You already have a subject with this name" });
    }

    updates.name = name.trim();
  }

  if (description !== undefined) {
    updates.description = description.trim();
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: "Nothing to update" });
  }

  const subject = await Subject.findOneAndUpdate(
    { _id: subjectId, user: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!subject) {
    return res.status(404).json({ success: false, message: "Subject not found" });
  }

  res.status(200).json({
    success: true,
    subject: {
      id: subject._id,
      name: subject.name,
      description: subject.description,
      createdAt: subject.createdAt,
    },
  });
});

// @desc   Delete a subject. Documents are NOT deleted — they move to Uncategorized.
// @route  DELETE /api/subjects/:subjectId
// @access Private
export const deleteSubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;

  if (!isValidId(subjectId)) {
    return res.status(404).json({ success: false, message: "Subject not found" });
  }

  const subject = await Subject.findOne({ _id: subjectId, user: req.user._id });

  if (!subject) {
    return res.status(404).json({ success: false, message: "Subject not found" });
  }

  await Document.updateMany(
    { user: req.user._id, subject: subject._id },
    { $set: { subject: null } }
  );

  await subject.deleteOne();

  res.status(200).json({
    success: true,
    message: "Subject deleted. Its documents were moved to Uncategorized.",
  });
});