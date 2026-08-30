import { useNavigate } from "react-router-dom";
import { Layers, ChevronRight } from "lucide-react";
import formatDate from "../../utils/formatDate.js";

const difficultyLabels = { easy: "Easy", medium: "Medium", hard: "Hard", mixed: "Mixed" };

const FlashcardSetHistoryItem = ({ flashcardSet }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/flashcards/${flashcardSet.id}`)}
      className="group w-full flex items-center justify-between gap-4 bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.1)] hover:border-violet-200 text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center shrink-0 ring-1 ring-violet-100 transition-transform duration-300 group-hover:scale-105">
          <Layers size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate transition-colors duration-200 group-hover:text-violet-700">
            {flashcardSet.title}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5 truncate">
            {flashcardSet.document?.title && `${flashcardSet.document.title} · `}
            {difficultyLabels[flashcardSet.difficulty]} · {flashcardSet.cardCount} cards ·{" "}
            {formatDate(flashcardSet.createdAt)}
          </p>
        </div>
      </div>
      <ChevronRight
        size={16}
        className="text-neutral-300 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-violet-400"
      />
    </button>
  );
};

export default FlashcardSetHistoryItem;