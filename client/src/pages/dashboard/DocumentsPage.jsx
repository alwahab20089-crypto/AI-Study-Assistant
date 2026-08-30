import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Search, FileText } from "lucide-react";
import {
  getDocumentsRequest,
  updateDocumentRequest,
  deleteDocumentRequest,
} from "../../services/documentService.js";
import { getSubjectsRequest } from "../../services/subjectService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";
import DocumentCard from "../../components/DocumentCard.jsx";
import DocumentCardSkeleton from "../../components/DocumentCardSkeleton.jsx";
import RenameModal from "../../components/RenameModal.jsx";
import MoveDocumentModal from "../../components/documents/MoveDocumentModal.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";

const fileTypeFilters = ["All", "PDF", "DOCX", "TXT"];

const DocumentsPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("all"); // "all" | "uncategorized" | subjectId
  const [sort, setSort] = useState("newest");

  const [renameTarget, setRenameTarget] = useState(null);
  const [moveTarget, setMoveTarget] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { sort };
      if (search.trim()) params.search = search.trim();
      if (typeFilter !== "All") params.fileType = typeFilter.toLowerCase();
      if (subjectFilter !== "all") params.subjectId = subjectFilter;

      const res = await getDocumentsRequest(params);
      setDocuments(res.data.documents);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, subjectFilter, sort]);

  useEffect(() => {
    getSubjectsRequest()
      .then((res) => setSubjects(res.data.subjects))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchDocuments, 250); // debounce search typing
    return () => clearTimeout(timeout);
  }, [fetchDocuments]);

  const handleRenameSave = async (id, data) => {
    setIsSaving(true);
    try {
      const res = await updateDocumentRequest(id, data);
      setDocuments((prev) =>
        prev.map((doc) => (doc._id === id ? { ...doc, ...res.data.document } : doc))
      );
      setRenameTarget(null);
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    } finally {
      setIsSaving(false);
    }
  };

  const handleMove = async (id, subjectId) => {
    setIsSaving(true);
    try {
      const res = await updateDocumentRequest(id, { subjectId });
      setDocuments((prev) =>
        prev.map((doc) => (doc._id === id ? { ...doc, ...res.data.document } : doc))
      );
      setMoveTarget(null);
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteDocumentRequest(deleteTarget._id);
      setDocuments((prev) => prev.filter((doc) => doc._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = search || typeFilter !== "All" || subjectFilter !== "all";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-serif font-bold text-neutral-900 tracking-tight">My Documents</h1>
        <button
          onClick={() => navigate("/documents/upload")}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium px-4 py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200"
        >
          <Upload size={16} />
          Upload Document
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 mt-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all duration-200"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all duration-200"
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          <option value="uncategorized">Uncategorized</option>
        </select>

        <div className="flex gap-2">
          {fileTypeFilters.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                typeFilter === type
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm shadow-violet-200"
                  : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all duration-200"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <DocumentCardSkeleton key={i} />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 mt-6 bg-white rounded-2xl border border-neutral-200/70">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center mx-auto mb-4 ring-1 ring-violet-100">
            <FileText size={24} />
          </div>
          <h3 className="text-lg font-serif font-semibold text-neutral-900">
            {hasActiveFilters ? "No documents found" : "No study materials yet"}
          </h3>
          <p className="text-sm text-neutral-500 mt-1.5 max-w-sm mx-auto">
            {hasActiveFilters
              ? "Try another search or change your filters."
              : "Upload your first PDF, Word document, or text file to start building your study library."}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={() => navigate("/documents/upload")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium px-5 py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200"
            >
              <Upload size={16} />
              Upload Document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {documents.map((doc) => (
            <DocumentCard
              key={doc._id}
              document={doc}
              onRename={setRenameTarget}
              onMove={setMoveTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {renameTarget && (
        <RenameModal
          document={renameTarget}
          onClose={() => setRenameTarget(null)}
          onSave={handleRenameSave}
          isSaving={isSaving}
        />
      )}

      {moveTarget && (
        <MoveDocumentModal
          document={moveTarget}
          onClose={() => setMoveTarget(null)}
          onMove={handleMove}
          isMoving={isSaving}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete document?"
          message={`"${deleteTarget.title}" will be permanently deleted. This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isConfirming={isDeleting}
        />
      )}
    </div>
  );
};

export default DocumentsPage;