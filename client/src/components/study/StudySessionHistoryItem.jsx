import { useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";
import formatDate from "../../utils/formatDate.js";

const difficultyLabels = { easy: "Easy", medium: "Medium", hard: "Hard", mixed: "Mixed" };

const StudySessionHistoryItem = ({ session }) => {
  const navigate = useNavigate();
  const accuracy =
    session.questionsAsked > 0
      ? Math.round((session.questionsCorrect / session.questionsAsked) * 100)
      : 0;

  const handleClick = () => {
    if (session.status === "active") {
      navigate(`/study/session/${session.id}`);
    } else {
      navigate(`/study/session/${session.id}/result`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group w-full flex items-center justify-between gap-4 bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.1)] hover:border-violet-200 text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center shrink-0 ring-1 ring-violet-100 transition-transform duration-300 group-hover:scale-105">
          <BookOpen size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate transition-colors duration-200 group-hover:text-violet-700">
            {session.document?.title || "Document"}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">
            {difficultyLabels[session.difficulty]} · {session.questionsAsked}/{session.questionLimit} questions ·{" "}
            {formatDate(session.createdAt)}
          </p>
        </div>
      </div>

      {session.status === "active" ? (
        <span className="text-xs font-semibold text-violet-600 bg-violet-50 rounded-full px-2.5 py-1 shrink-0">
          In progress
        </span>
      ) : session.status === "completed" ? (
        <span className="text-sm font-semibold text-violet-600 shrink-0">{accuracy}%</span>
      ) : (
        <span className="text-xs font-medium text-neutral-400 shrink-0">Abandoned</span>
      )}
    </button>
  );
};

export default StudySessionHistoryItem;