import fs from "fs/promises";

// pdf-parse's package entrypoint runs a debug script on import in some versions
// when required directly, so we import the internal lib file to avoid that.
import * as pdfParse from 'pdf-parse';
const extractPdfText = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(buffer);
  return data.text || "";
};

export default extractPdfText;