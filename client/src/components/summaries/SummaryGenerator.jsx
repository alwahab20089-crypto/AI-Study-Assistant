import { useState } from "react";
import { Sparkles } from "lucide-react";

const LENGTH_OPTIONS = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "detailed", label: "Detailed" },
];

const SummaryGenerator = ({ onGenerate, isGenerating }) => {
  const [length, setLength] = useState("medium");

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6 transition-shadow duration-300 hover:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center ring-1 ring-violet-100">
          <Sparkles size={16} />
        </div>
        <h2 className="font-serif font-semibold text-neutral-900">AI Study Tools</h2>
      </div>
      <p className="text-sm text-neutral-500 mb-5">
        Generate a summary of this document using AI.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Length</label>
          <select
            value={length}
            onChange={(e) => setLength(e.target.value)}
            disabled={isGenerating}
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all duration-200 disabled:opacity-60"
          >
            {LENGTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onGenerate(length)}
          disabled={isGenerating}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium px-5 py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap"
        >
          {isGenerating ? "Generating..." : "Generate Summary"}
        </button>
      </div>
    </div>
  );
};

export default SummaryGenerator;