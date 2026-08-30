import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UploadCloud, FileText, X, CheckCircle2 } from "lucide-react";
import { uploadDocumentRequest } from "../../services/documentService.js";
import { getSubjectsRequest } from "../../services/subjectService.js";
import validateFile from "../../utils/validateFile.js";
import formatFileSize from "../../utils/formatFileSize.js";
import getErrorMessage from "../../utils/getErrorMessage.js";

const UploadDocumentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState(searchParams.get("subjectId") || "");
  const [subjects, setSubjects] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | uploading | success

  useEffect(() => {
    getSubjectsRequest()
      .then((res) => setSubjects(res.data.subjects))
      .catch(() => {});
  }, []);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setError("");
    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setError("");
    setProgress(0);
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setError("");
    setStatus("uploading");
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    if (title.trim()) formData.append("title", title.trim());
    if (subjectId) formData.append("subjectId", subjectId);

    try {
      await uploadDocumentRequest(formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percent);
      });

      setStatus("success");
      setTimeout(() => navigate(subjectId ? `/subjects/${subjectId}` : "/documents"), 1200);
    } catch (err) {
      setStatus("idle");
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-serif font-bold text-neutral-900 tracking-tight">Upload Document</h1>
      <p className="text-neutral-500 mt-1.5 text-sm">
        Supported formats: PDF, DOCX, TXT · Maximum file size: 10 MB
      </p>

      <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6 mt-6">
        {error && (
          <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {status === "success" ? (
          <div className="text-center py-10">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
            <p className="font-medium text-neutral-900">Upload successful!</p>
            <p className="text-sm text-neutral-500 mt-1">Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl px-6 py-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-violet-400 bg-violet-50 scale-[1.01]"
                    : "border-neutral-200 hover:border-violet-300 hover:bg-neutral-50"
                }`}
              >
                <UploadCloud size={32} className="text-violet-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-neutral-700">
                  Drag & drop your file here, or click to browse
                </p>
                <p className="text-xs text-neutral-400 mt-1.5">PDF, DOCX, or TXT — up to 10 MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 px-4 py-3.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center shrink-0 ring-1 ring-violet-100">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{file.name}</p>
                  <p className="text-xs text-neutral-400">{formatFileSize(file.size)}</p>
                </div>
                {status !== "uploading" && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-neutral-400 hover:text-neutral-600 shrink-0 transition-colors duration-200"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            {status === "uploading" && (
              <div>
                <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1.5">Uploading... {progress}%</p>
              </div>
            )}

            {file && status !== "uploading" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Document title"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Subject
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all duration-200"
                  >
                    <option value="">Uncategorized</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/documents")}
                className="flex-1 rounded-xl border border-neutral-200 text-neutral-600 font-medium py-2.5 text-sm hover:bg-neutral-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || status === "uploading"}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {status === "uploading" ? "Uploading..." : "Upload Document"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UploadDocumentPage;