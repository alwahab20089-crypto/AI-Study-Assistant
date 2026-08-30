import { useState } from "react";
import { Layers } from "lucide-react";

const CARD_COUNTS = [5, 10, 15, 20];
const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "mixed", label: "Mixed" },
];

const FlashcardGenerator = ({ onGenerate, isGenerating }) => {
  const [cardCount, setCardCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6 transition-shadow duration-300 hover:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center ring-1 ring-violet-100">
          <Layers size={16} />
        </div>
        <h2 className="font-serif font-semibold text-neutral-900">Generate Flashcards</h2>
      </div>
      <p className="text-sm text-neutral-500 mb-5">
        Create study flashcards from this document.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Number of cards
          </label>
          <select
            value={cardCount}
            onChange={(e) => setCardCount(Number(e.target.value))}
            disabled={isGenerating}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all duration-200 disabled:opacity-60"
          >
            {CARD_COUNTS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={isGenerating}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all duration-200 disabled:opacity-60"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => onGenerate(cardCount, difficulty)}
        disabled={isGenerating}
        className="w-full mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isGenerating ? "Generating..." : "Generate Flashcards"}
      </button>
    </div>
  );
};

export default FlashcardGenerator;