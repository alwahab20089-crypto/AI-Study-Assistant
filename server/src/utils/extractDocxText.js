import mammoth from "mammoth";

const extractDocxText = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || "";
};

export default extractDocxText;