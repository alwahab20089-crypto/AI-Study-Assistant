const optionLetters = ["A", "B", "C", "D"];

const QuizQuestion = ({ question, selectedAnswer, onSelect }) => {
  return (
    <div>
      <h2 className="text-lg font-serif font-semibold text-neutral-900 mb-6 leading-relaxed">
        {question.question}
      </h2>

      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          return (
            <button
              key={index}
              onClick={() => onSelect(index)}
              className={`w-full flex items-center gap-3 text-left rounded-xl border px-4 py-3.5 transition-all duration-200 ease-out ${
                isSelected
                  ? "border-violet-500 bg-violet-50 shadow-[0_4px_16px_-6px_rgba(109,40,217,0.3)]"
                  : "border-neutral-200 hover:border-violet-200 hover:bg-neutral-50 hover:-translate-y-0.5"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors duration-200 ${
                  isSelected
                    ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {optionLetters[index]}
              </span>
              <span className={`text-sm ${isSelected ? "text-violet-900 font-medium" : "text-neutral-700"}`}>
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizQuestion;