import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { getDocumentByIdRequest } from "../../services/documentService.js";
import { startStudySessionRequest, listStudySessionsRequest } from "../../services/studyService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";
import StudySetup from "../../components/study/StudySetup.jsx";
import ResumeSessionBanner from "../../components/study/ResumeSessionBanner.jsx";

const StudySetupPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const [showNewSetup, setShowNewSetup] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const [docRes, sessionsRes] = await Promise.all([
          getDocumentByIdRequest(documentId),
          listStudySessionsRequest(documentId),
        ]);
        setDocument(docRes.data.document);
        const active = (sessionsRes.data.sessions || []).find((s) => s.status === "active");
        setActiveSession(active || null);
      } catch (err) {
        setLoadError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [documentId]);

  const handleStart = async (difficulty, questionLimit) => {
    setStarting(true);
    setStartError("");
    try {
      const res = await startStudySessionRequest(documentId, difficulty, questionLimit);
      navigate(`/study/session/${res.data.session.id}`);
    } catch (err) {
      setStartError(getErrorMessage(err));
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-4 bg-neutral-100 rounded w-24 mb-6" />
        <div className="h-64 bg-neutral-100 rounded-2xl" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-sm text-red-500">{loadError}</p>
        <Link to="/documents" className="text-violet-600 text-sm font-medium mt-4 inline-block hover:text-violet-700 transition-colors duration-200">
          Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to={`/documents/${documentId}`}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-violet-700 mb-4 transition-colors duration-200"
      >
        <ArrowLeft size={16} />
        Back to document
      </Link>

      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center shrink-0 ring-1 ring-violet-100">
          <FileText size={16} />
        </div>
        <div>
          <h1 className="font-serif font-semibold text-neutral-900">{document.title}</h1>
          <p className="text-xs text-neutral-400">NovaStudy AI · Study Mode</p>
        </div>
      </div>

      {startError && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {startError}
        </div>
      )}

      {activeSession && !showNewSetup ? (
        <ResumeSessionBanner
          session={activeSession}
          onResume={() => navigate(`/study/session/${activeSession.id}`)}
          onStartNew={() => setShowNewSetup(true)}
        />
      ) : (
        <StudySetup onStart={handleStart} isStarting={starting} />
      )}
    </div>
  );
};

export default StudySetupPage;