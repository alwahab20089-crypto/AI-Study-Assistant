import { useState, useEffect } from "react";
import { Plus, BookOpen } from "lucide-react";
import { getSubjectsRequest, createSubjectRequest } from "../../services/subjectService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";
import SubjectCard from "../../components/subjects/SubjectCard.jsx";
import SubjectForm from "../../components/subjects/SubjectForm.jsx";

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSubjects = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getSubjectsRequest();
      setSubjects(res.data.subjects);
      setUncategorizedCount(res.data.uncategorizedCount || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreate = async (data) => {
    setIsSaving(true);
    try {
      await createSubjectRequest(data);
      setShowForm(false);
      await fetchSubjects();
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-serif font-bold text-neutral-900 tracking-tight">My Subjects</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium px-4 py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200"
        >
          <Plus size={16} />
          New Subject
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-white border border-neutral-200/70 animate-pulse" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-16 mt-6 bg-white rounded-2xl border border-neutral-200/70">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center mx-auto mb-4 ring-1 ring-violet-100">
            <BookOpen size={24} />
          </div>
          <h3 className="text-lg font-serif font-semibold text-neutral-900">No subjects yet</h3>
          <p className="text-sm text-neutral-500 mt-1.5 max-w-sm mx-auto">
            Create your first subject to organize your study material.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium px-5 py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200"
          >
            <Plus size={16} />
            Create Subject
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
          {uncategorizedCount > 0 && (
            <p className="text-sm text-neutral-400 mt-6">
              {uncategorizedCount} uncategorized {uncategorizedCount === 1 ? "document" : "documents"}{" "}
              — view them from the Documents page.
            </p>
          )}
        </>
      )}

      {showForm && (
        <SubjectForm onClose={() => setShowForm(false)} onSave={handleCreate} isSaving={isSaving} />
      )}
    </div>
  );
};

export default SubjectsPage;