import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { getStudySessionRequest } from "../../services/studyService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";
import StudySessionSummary from "../../components/study/StudySessionSummary.jsx";

const correctnessConfig = {
  correct: { icon: CheckCircle2, label: "Correct", className: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  partial: { icon: AlertCircle, label: "Partial", className: "text-amber-700 bg-amber-50 border-amber-100" },
  incorrect: { icon: XCircle, label: "Incorrect", className: "text-red-700 bg-red-50 border-red-100" },
};

const StudyResultPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await getStudySessionRequest(sessionId);
        setSession(res.data.session);
        setTurns(res.data.turns || []);
      } catch (err) {
        setLoadError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-4 bg-neutral-100 rounded w-24 mb-6" />
        <div className="h-72 bg-neutral-100 rounded-2xl" />
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

  const documentId = session.document?.id || session.document;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to={`/documents/${documentId}`}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-violet-700 mb-4 transition-colors duration-200"
      >
        <ArrowLeft size={16} />
        Back to document
      </Link>

      {!showReview ? (
        <StudySessionSummary
          session={session}
          onReview={() => setShowReview(true)}
          onStudyAgain={() => navigate(`/study/${documentId}`)}
          onBackToDocument={() => navigate(`/documents/${documentId}`)}
        />
      ) : (
        <div className="space-y-4">
          <button onClick={() => setShowReview(false)} className="text-sm text-violet-600 font-medium hover:text-violet-700 transition-colors duration-200">
            &larr; Back to summary
          </button>

          {turns.map((turn, index) => {
            const config = correctnessConfig[turn.correctness] || correctnessConfig.partial;
            const Icon = config.icon;

            return (
              <div key={index} className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5 transition-shadow duration-300 hover:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.1)]">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-1">
                  Question {index + 1}
                </p>
                <p className="text-sm font-semibold text-neutral-900 mb-3">{turn.question}</p>

                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-1">
                  Your answer
                </p>
                <p className="text-sm text-neutral-700 mb-3">{turn.studentAnswer}</p>

                <div
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium mb-2 ${config.className}`}
                >
                  <Icon size={13} />
                  {config.label}
                </div>
                <p className="text-sm text-neutral-700">{turn.feedback}</p>
                {turn.explanation && <p className="text-sm text-neutral-500 mt-1.5">{turn.explanation}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudyResultPage;