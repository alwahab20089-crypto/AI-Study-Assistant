import { useState, useEffect } from "react";
import { getSubjectsRequest } from "../../services/subjectService.js";

const MoveDocumentModal = ({ document, onClose, onMove, isMoving }) => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    document.subject?._id || document.subject || ""
  );
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    getSubjectsRequest()
      .then((res) => setSubjects(res.data.subjects))
      .catch(() => setError("Couldn't load subjects"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await onMove(document._id, selectedSubjectId || null);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 bg-neutral-900/50 backdrop-blur-sm transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] p-6 w-full max-w-sm transition-all duration-250 ease-out ${
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
        }`}
      >
        <h3 className="text-lg font-serif font-semibold text-neutral-900 mb-1">Move document</h3>
        <p className="text-sm text-neutral-500 mb-4 truncate">{document.title}</p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Subject</label>
            <select
              value={selectedSubjectId || ""}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-neutral-200 text-neutral-600 font-medium py-2.5 text-sm hover:bg-neutral-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isMoving}
              className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 disabled:opacity-60 transition-all duration-200"
            >
              {isMoving ? "Moving..." : "Move"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MoveDocumentModal;