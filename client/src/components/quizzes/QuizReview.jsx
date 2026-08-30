import { CheckCircle2, XCircle } from "lucide-react";

const optionLetters = ["A", "B", "C", "D"];

const QuizReview = ({ review }) => {
  return (
    <div className="space-y-5">
      {review.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6 transition-shadow duration-300 hover:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.1)]"
        >
          <div className="flex items-start gap-2.5 mb-4">
            {item.correct ? (
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs text-neutral-400 font-medium">Question {index + 1}</p>
              <h3 className="text-sm font-semibold text-neutral-900 mt-0.5 leading-relaxed">
                {item.question}
              </h3>
            </div>
          </div>

          <div className="space-y-2 ml-7">
            {item.selectedAnswer !== -1 && (
              <div
                className={`text-sm rounded-xl px-3.5 py-2.5 ${
                  item.correct ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}
              >
                <span className="font-medium">Your answer: </span>
                {optionLetters[item.selectedAnswer]}. {item.options[item.selectedAnswer]}
              </div>
            )}

            {item.selectedAnswer === -1 && (
              <div className="text-sm rounded-xl px-3.5 py-2.5 bg-neutral-50 text-neutral-500">
                You didn't answer this question
              </div>
            )}

            {!item.correct && (
              <div className="text-sm rounded-xl px-3.5 py-2.5 bg-emerald-50 text-emerald-700">
                <span className="font-medium">Correct answer: </span>
                {optionLetters[item.correctAnswer]}. {item.options[item.correctAnswer]}
              </div>
            )}

            <div className="text-sm text-neutral-600 px-3.5 py-2.5 bg-neutral-50 rounded-xl">
              <span className="font-medium text-neutral-700">Explanation: </span>
              {item.explanation}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuizReview;