const FlashcardCard = ({ card, isFlipped, onFlip }) => {
  return (
    <div className="[perspective:1200px]">
      <button
        onClick={onFlip}
        aria-pressed={isFlipped}
        aria-label={isFlipped ? "Showing answer. Click to show question." : "Showing question. Click to reveal answer."}
        className="group relative w-full h-72 sm:h-80 [transform-style:preserve-3d] transition-transform duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 rounded-2xl"
        style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* Front */}
        <div className="absolute inset-0 [backface-visibility:hidden] bg-white border border-neutral-200/70 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.1)] rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-shadow duration-300 group-hover:shadow-[0_16px_36px_-12px_rgba(109,40,217,0.2)]">
          <p className="text-lg font-serif font-medium text-neutral-900 leading-relaxed">{card.front}</p>
          <p className="text-xs text-neutral-400 mt-6 uppercase tracking-wide">Click to reveal</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 [backface-visibility:hidden] bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl shadow-[0_16px_36px_-12px_rgba(109,40,217,0.4)] flex flex-col items-center justify-center p-8 text-center"
          style={{ transform: "rotateY(180deg)" }}
        >
          <p className="text-base leading-relaxed">{card.back}</p>
        </div>
      </button>
    </div>
  );
};

export default FlashcardCard;