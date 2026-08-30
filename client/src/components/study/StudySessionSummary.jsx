import { PartyPopper } from "lucide-react";

const StudySessionSummary = ({ session, onReview, onStudyAgain, onBackToDocument }) => {
  const { questionsAsked, questionsCorrect, questionsPartiallyCorrect, questionsIncorrect } = session;
  const accuracy = questionsAsked > 0 ? Math.round((questionsCorrect / questionsAsked) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center mx-auto mb-4 ring-1 ring-violet-100">
        <PartyPopper size={24} />
      </div>
      <h1 className="text-xl font-serif font-bold text-neutral-900">Study Session Complete 🎉</h1>
      <p className="text-sm text-neutral-500 mt-1">You completed {questionsAsked} questions</p>

      <div className="flex items-center justify-center gap-6 mt-6">
        <div>
          <p className="text-2xl font-serif font-bold text-emerald-600">{questionsCorrect}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Correct</p>
        </div>
        <div>
          <p className="text-2xl font-serif font-bold text-amber-600">{questionsPartiallyCorrect}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Partial</p>
        </div>
        <div>
          <p className="text-2xl font-serif font-bold text-red-500">{questionsIncorrect}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Incorrect</p>
        </div>
      </div>

      <p className="text-sm font-medium text-neutral-700 mt-6">Accuracy: {accuracy}%</p>

      <div className="flex flex-col gap-2.5 mt-8">
        <button
          onClick={onReview}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200"
        >
          Review Session
        </button>
        <button
          onClick={onStudyAgain}
          className="rounded-xl border border-neutral-200 text-neutral-700 font-medium py-2.5 text-sm hover:bg-neutral-50 transition-colors duration-200"
        >
          Study Again
        </button>
        <button
          onClick={onBackToDocument}
          className="rounded-xl border border-neutral-200 text-neutral-700 font-medium py-2.5 text-sm hover:bg-neutral-50 transition-colors duration-200"
        >
          Back to Document
        </button>
      </div>
    </div>
  );
};

export default StudySessionSummary;