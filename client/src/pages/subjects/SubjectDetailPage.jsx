import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Upload, Pencil, Trash2, FileText, ChevronRight } from "lucide-react";
import {
  getSubjectByIdRequest,
  updateSubjectRequest,
  deleteSubjectRequest,
} from "../../services/subjectService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";
import formatFileSize from "../../utils/formatFileSize.js";
import formatDate from "../../utils/formatDate.js";
import SubjectForm from "../../components/subjects/SubjectForm.jsx";
import DeleteSubjectModal from "../../components/subjects/DeleteSubjectModal.jsx";

const SubjectDetailPage = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSubject = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getSubjectByIdRequest(subjectId);
      setSubject(res.data.subject);
      setDocuments(res.data.documents);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const handleEditSave = async (data) => {
    setIsSaving(true);
    try {
      const res = await updateSubjectRequest(subjectId, data);
      setSubject(res.data.subject);
      setShowEdit(false);
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
      await deleteSubjectRequest(subjectId);
      navigate("/subjects");
    } catch (err) {
      setError(getErrorMessage(err));
      setShowDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-neutral-500">Loading subject...</div>;
  }

  if (error && !subject) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!subject) return null;

  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm text-neutral-400 mb-4">
        <Link to="/subjects" className="hover:text-violet-600 transition-colors duration-200">
          Subjects
        </Link>
        <ChevronRight size={14} />
        <span className="text-neutral-600">{subject.name}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-neutral-900 tracking-tight">{subject.name}</h1>
          {subject.description && (
            <p className="text-neutral-500 mt-1.5 text-sm max-w-lg">{subject.description}</p>
          )}
          <p className="text-sm text-neutral-400 mt-2">
            {documents.length} {documents.length === 1 ? "document" : "documents"}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 text-neutral-600 font-medium px-4 py-2.5 text-sm hover:bg-neutral-50 hover:border-violet-200 hover:text-violet-700 transition-all duration-200"
          >
            <Pencil size={16} /> Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 rounded-xl border border-red-100 text-red-500 font-medium px-4 py-2.5 text-sm hover:bg-red-50 transition-colors duration-200"
          >
            <Trash2 size={16} /> Delete
          </button>
          <button
            onClick={() => navigate(`/documents/upload?subjectId=${subjectId}`)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium px-4 py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200"
          >
            <Upload size={16} /> Upload
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-16 mt-6 bg-white rounded-2xl border border-neutral-200/70">
          <p className="text-sm text-neutral-500">No documents in {subject.name} yet.</p>
          <button
            onClick={() => navigate(`/documents/upload?subjectId=${subjectId}`)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium px-5 py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200"
          >
            <Upload size={16} /> Upload Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {documents.map((doc) => (
            <div
              key={doc._id}
              onClick={() => navigate(`/documents/${doc._id}`)}
              className="group bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.1)] hover:border-violet-200 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center mb-3 ring-1 ring-violet-100 transition-transform duration-300 group-hover:scale-105">
                <FileText size={18} />
              </div>
              <h3 className="font-medium text-neutral-900 truncate transition-colors duration-200 group-hover:text-violet-700">
                {doc.title}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5 uppercase tracking-wide">
                {doc.fileType} • {formatFileSize(doc.fileSize)}
              </p>
              <p className="text-xs text-neutral-400 mt-1.5">Uploaded {formatDate(doc.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {showEdit && (
        <SubjectForm
          initialValues={subject}
          onClose={() => setShowEdit(false)}
          onSave={handleEditSave}
          isSaving={isSaving}
        />
      )}

      {showDelete && (
        <DeleteSubjectModal
          subject={subject}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDelete(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default SubjectDetailPage;