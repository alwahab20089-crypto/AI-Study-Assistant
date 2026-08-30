const FlashcardProgressBar = ({ current, total }) => {
  const percent = ((current + 1) / total) * 100;

  return (
    <div>
      <p className="text-center text-sm text-neutral-500 mb-2">
        Card {current + 1} of {total}
      </p>
      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default FlashcardProgressBar;