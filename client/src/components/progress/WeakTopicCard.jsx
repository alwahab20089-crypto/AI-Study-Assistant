import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const WeakTopicCard = ({ topic }) => {
  const { topic: topicName, subjectName, documentId, accuracy, correct, attempts } = topic;

  const practiceQuizHref = documentId
    ? `/documents/${documentId}?topic=${encodeURIComponent(topicName)}`
    : null;

  return (
    <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-amber-50/30 p-5 transition-all duration-300 hover:shadow-[0_12px_28px_-12px_rgba(245,158,11,0.3)] hover:-translate-y-0.5">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-neutral-900 truncate">{topicName}</p>
          {subjectName && <p className="text-xs text-neutral-500 mt-0.5">{subjectName}</p>}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-neutral-500">Accuracy</span>
          <span className="text-xs font-semibold text-amber-600">{accuracy}%</span>
        </div>
        <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 ease-out"
            style={{ width: `${Math.min(accuracy, 100)}%` }}
          />
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          {correct} / {attempts} correct
        </p>
      </div>

      {(documentId || practiceQuizHref) && (
        <div className="flex gap-2 mt-4">
          {documentId && (
            <Link
              to={`/documents/${documentId}`}
              className="flex-1 text-center rounded-xl border border-neutral-200 bg-white text-neutral-700 font-medium px-3 py-2 text-xs hover:bg-neutral-50 transition-colors duration-200"
            >
              Review Material
            </Link>
          )}
          {practiceQuizHref && (
            <Link
              to={practiceQuizHref}
              className="flex-1 text-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium px-3 py-2 text-xs hover:shadow-md hover:shadow-violet-300/50 transition-all duration-200"
            >
              Practice Quiz
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default WeakTopicCard;