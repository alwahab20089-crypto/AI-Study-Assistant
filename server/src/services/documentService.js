import fs from "fs/promises";
import extractPdfText from "../utils/extractPdfText.js";
import extractDocxText from "../utils/extractDocxText.js";
import extractTxtText from "../utils/extractTxtText.js";
import { normalizeText, isMeaningfulText } from "../utils/cleanExtractedText.js";

export const extractTextByType = async (filePath, fileType) => {
  let rawText = "";

  switch (fileType) {
    case "pdf":
      rawText = await extractPdfText(filePath);
      break;
    case "docx":
      rawText = await extractDocxText(filePath);
      break;
    case "txt":
      rawText = await extractTxtText(filePath);
      break;
    default:
      throw new Error("Unsupported file type for extraction");
  }

  return normalizeText(rawText);
};

export const deleteFileIfExists = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File already missing — not a failure condition, just move on
    if (error.code !== "ENOENT") {
      console.error(`Failed to delete file at ${filePath}:`, error.message);
    }
  }
};

export { isMeaningfulText };