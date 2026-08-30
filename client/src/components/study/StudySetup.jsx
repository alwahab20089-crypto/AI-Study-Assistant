import { useState } from "react";
import { GraduationCap } from "lucide-react";

const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "mixed", label: "Mixed" },
];

const SESSION_LENGTHS = [5, 10, 15, 20];

const StudySetup = ({ onStart, isStarting }) => {
  const [difficulty, setDifficulty] = useState("medium");
  const [questionLimit, setQuestionLimit] = useState(10);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6 transition-shadow duration-300 hover:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center ring-1 ring-violet-100">
          <GraduationCap size={16} />
        </div>
        <h2 className="font-serif font-semibold text-neutral-900">Start Study Session</h2>
      </div>
      <p className="text-sm text-neutral-500 mb-5">
        The AI tutor will ask you questions based only on this document.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={isStarting}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all duration-200 disabled:opacity-60"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Session length</label>
          <select
            value={questionLimit}
            onChange={(e) => setQuestionLimit(Number(e.target.value))}
            disabled={isStarting}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all duration-200 disabled:opacity-60"
          >
            {SESSION_LENGTHS.map((n) => (
              <option key={n} value={n}>
                {n} questions
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => onStart(difficulty, questionLimit)}
        disabled={isStarting}
        className="w-full mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
      >
        {isStarting ? "Starting..." : "Start Studying"}
      </button>
    </div>
  );
};

export default StudySetup;