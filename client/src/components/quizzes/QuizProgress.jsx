const QuizProgress = ({ current, total, answeredCount }) => {
  const percent = ((current + 1) / total) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-sm text-neutral-500 mb-2">
        <span>
          Question {current + 1} of {total}
        </span>
        <span>{answeredCount} answered</span>
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

export default QuizProgress;