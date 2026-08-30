import { RefreshCw, Trash2 } from "lucide-react";
import SummaryContent from "./SummaryContent.jsx";

const lengthLabels = { short: "Short", medium: "Medium", detailed: "Detailed" };

const SummaryCard = ({ summary, onRegenerate, onDelete, isRegenerating, isDeleting }) => {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6 transition-shadow duration-300 hover:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif font-semibold text-neutral-900">Chapter Summary</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {lengthLabels[summary.length]} length
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onRegenerate(summary.length)}
            disabled={isRegenerating || isDeleting}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 text-neutral-600 font-medium px-3 py-1.5 text-xs hover:bg-neutral-50 hover:border-violet-200 hover:text-violet-700 disabled:opacity-60 transition-all duration-200"
          >
            <RefreshCw size={13} className={isRegenerating ? "animate-spin" : ""} />
            Regenerate
          </button>
          <button
            onClick={() => onDelete(summary.id)}
            disabled={isRegenerating || isDeleting}
            className="flex items-center gap-1.5 rounded-xl border border-red-100 text-red-500 font-medium px-3 py-1.5 text-xs hover:bg-red-50 disabled:opacity-60 transition-colors duration-200"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>

      <SummaryContent content={summary.content} />
    </div>
  );
};

export default SummaryCard;