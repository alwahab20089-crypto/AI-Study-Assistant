const StudyProgress = ({ questionsAsked, questionLimit, correct, partial, incorrect }) => {
  const percent = questionLimit > 0 ? (questionsAsked / questionLimit) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm text-neutral-500 mb-2">
        <span>
          Question {Math.min(questionsAsked + 1, questionLimit)} of {questionLimit}
        </span>
        <span className="flex items-center gap-3 text-xs">
          <span className="text-emerald-600 font-medium">Correct: {correct}</span>
          <span className="text-amber-600 font-medium">Partial: {partial}</span>
          <span className="text-red-500 font-medium">Incorrect: {incorrect}</span>
        </span>
      </div>
      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default StudyProgress;