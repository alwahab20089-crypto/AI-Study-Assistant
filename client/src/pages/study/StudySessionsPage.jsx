import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";
import { listStudySessionsRequest } from "../../services/studyService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";
import StudySessionHistoryItem from "../../components/study/StudySessionHistoryItem.jsx";

const StudySessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await listStudySessionsRequest();
        setSessions(res.data.sessions || []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 bg-neutral-100 rounded w-48 mb-6 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-20 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-neutral-900 tracking-tight">Study Sessions</h1>
        <p className="text-sm text-neutral-500 mt-1">Resume an unfinished session or review a past one.</p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!error && sessions.length === 0 && (
        <div className="bg-white border border-neutral-200/70 rounded-2xl p-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <BookOpen size={40} className="mx-auto text-violet-300 mb-3" />
          <h2 className="font-serif font-semibold text-neutral-900">No study sessions yet</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Open a document and start a Study Mode session to see it here.
          </p>
          <Link
            to="/documents"
            className="inline-flex items-center gap-2 mt-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200"
          >
            Browse Documents
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {sessions.map((session) => (
          <StudySessionHistoryItem key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
};

export default StudySessionsPage;