import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

const ALLOWED_EXTENSIONS = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".txt": "txt",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate a safe, unique filename — never trust the original filename
    const ext = ALLOWED_EXTENSIONS[path.extname(file.originalname).toLowerCase()]
      ? path.extname(file.originalname).toLowerCase()
      : "";
    const uniqueName = `${Date.now()}-${crypto.randomBytes(16).toString("hex")}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  const extAllowed = Object.prototype.hasOwnProperty.call(ALLOWED_EXTENSIONS, ext);
  const mimeAllowed = Object.prototype.hasOwnProperty.call(
    ALLOWED_MIME_TYPES,
    file.mimetype
  );

  // Require both extension AND mimetype to look legitimate.
  // Not foolproof on its own (browsers can lie about mimetype), but combined
  // with the later content-based check in documentService this is a reasonable MVP layer.
  if (!extAllowed || !mimeAllowed) {
    return cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        "Unsupported file type. Please upload a PDF, DOCX, or TXT file."
      )
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

export const uploadSingleFile = upload.single("file");

// Wraps multer's callback-style middleware so errors become clean JSON responses
// instead of crashing or leaking internals.
export const handleUpload = (req, res, next) => {
  uploadSingleFile(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File is too large. Maximum size is 10 MB.",
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "File upload failed.",
      });
    }

    if (err) {
      return res.status(400).json({
        success: false,
        message: "File upload failed. Please try again.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file was uploaded.",
      });
    }

    next();
  });
};

export { UPLOAD_DIR, ALLOWED_EXTENSIONS };