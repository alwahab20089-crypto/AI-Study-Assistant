import { PartyPopper, Sparkles } from "lucide-react";

const FlashcardComplete = ({ progress, onRestart, onReviewDifficult, onBackToDocument }) => {
  const allKnown = progress.review === 0;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center mx-auto mb-4 ring-1 ring-violet-100">
        <PartyPopper size={24} />
      </div>
      <h1 className="text-xl font-serif font-bold text-neutral-900">Flashcards Complete 🎉</h1>
      <p className="text-sm text-neutral-500 mt-1">{progress.total} cards reviewed</p>

      <div className="flex items-center justify-center gap-8 mt-6">
        <div>
          <p className="text-2xl font-serif font-bold text-emerald-600">{progress.known}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Known</p>
        </div>
        <div>
          <p className="text-2xl font-serif font-bold text-amber-600">{progress.review}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Need Review</p>
        </div>
      </div>

      {allKnown ? (
        <p className="flex items-center justify-center gap-1.5 text-sm text-emerald-600 font-medium mt-6">
          <Sparkles size={15} />
          Great job! You marked every card as known.
        </p>
      ) : null}

      <div className="flex flex-col gap-2.5 mt-8">
        <button
          onClick={onRestart}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200"
        >
          Review Again
        </button>
        {!allKnown && (
          <button
            onClick={onReviewDifficult}
            className="rounded-xl border border-neutral-200 text-neutral-700 font-medium py-2.5 text-sm hover:bg-neutral-50 transition-colors duration-200"
          >
            Review Only Difficult Cards
          </button>
        )}
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

export default FlashcardComplete;