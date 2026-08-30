import fs from "fs/promises";

const extractTxtText = async (filePath) => {
  const text = await fs.readFile(filePath, "utf-8");
  return text || "";
};

export default extractTxtText;