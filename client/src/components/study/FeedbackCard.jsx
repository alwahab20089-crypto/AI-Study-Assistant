import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

const CONFIG = {
  correct: { icon: CheckCircle2, label: "Correct!", className: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  partial: { icon: AlertCircle, label: "Almost there", className: "text-amber-700 bg-amber-50 border-amber-100" },
  incorrect: { icon: XCircle, label: "Not quite", className: "text-red-700 bg-red-50 border-red-100" },
};

const FeedbackCard = ({ correctness, feedback, explanation }) => {
  const config = CONFIG[correctness] || CONFIG.partial;
  const Icon = config.icon;

  return (
    <div className="flex gap-3 animate-[fadeIn_0.3s_ease-out]">
      <div className="w-8 h-8 shrink-0" />
      <div className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${config.className}`}>
        <div className="flex items-center gap-1.5 font-semibold mb-1.5">
          <Icon size={16} />
          {config.label}
        </div>
        <p className="whitespace-pre-wrap leading-relaxed">{feedback}</p>
        {explanation && (
          <p className="mt-2 whitespace-pre-wrap leading-relaxed opacity-90">{explanation}</p>
        )}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

export default FeedbackCard;