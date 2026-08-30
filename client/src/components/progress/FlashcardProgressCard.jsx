const FlashcardProgressCard = ({ flashcards }) => {
  if (flashcards.totalReviewed === 0) {
    return <p className="text-sm text-neutral-500">No flashcards reviewed yet.</p>;
  }

  const knownPercent = Math.round((flashcards.known / flashcards.totalReviewed) * 100);

  return (
    <div>
      <p className="text-sm text-neutral-500 mb-4">{flashcards.totalReviewed} cards reviewed</p>
      <div className="flex items-center gap-8">
        <div>
          <p className="text-2xl font-serif font-bold text-emerald-600">{flashcards.known}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Known</p>
        </div>
        <div>
          <p className="text-2xl font-serif font-bold text-amber-600">{flashcards.needReview}</p>
          <p className="text-xs text-neutral-500 mt-0.5">Need Review</p>
        </div>
        <div>
          <p className="text-2xl font-serif font-bold text-neutral-900">{knownPercent}%</p>
          <p className="text-xs text-neutral-500 mt-0.5">Known Rate</p>
        </div>
      </div>
    </div>
  );
};

export default FlashcardProgressCard;