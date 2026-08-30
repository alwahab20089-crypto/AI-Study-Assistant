import { useState } from "react";
import { Send } from "lucide-react";

const AnswerInput = ({ onSubmit, disabled }) => {
  const [value, setValue] = useState("");
  const [touchedError, setTouchedError] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setTouchedError("Please enter an answer before submitting.");
      return;
    }
    setTouchedError("");
    setValue("");
    onSubmit(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div>
      {touchedError && <p className="text-xs text-amber-600 mb-2">{touchedError}</p>}
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (touchedError) setTouchedError("");
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer..."
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all duration-200 disabled:opacity-60 max-h-32"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center hover:shadow-lg hover:shadow-violet-300/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default AnswerInput;