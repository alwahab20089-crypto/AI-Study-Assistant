import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Check, RefreshCcw } from "lucide-react";
import {
  getFlashcardSetRequest,
  submitFlashcardProgressRequest,
  getFlashcardProgressRequest,
} from "../../services/flashcardService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";
import FlashcardCard from "../../components/flashcards/FlashcardCard.jsx";
import FlashcardProgressBar from "../../components/flashcards/FlashcardProgressBar.jsx";
import FlashcardComplete from "../../components/flashcards/FlashcardComplete.jsx";

const difficultyLabels = { easy: "Easy", medium: "Medium", hard: "Hard", mixed: "Mixed" };

const FlashcardPage = () => {
  const { flashcardSetId } = useParams();
  const navigate = useNavigate();

  const [flashcardSet, setFlashcardSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // activeIndexes lets "Review Only Difficult Cards" restrict which cards
  // are being cycled through, without needing a second page or a re-fetch
  const [activeIndexes, setActiveIndexes] = useState([]);
  const [currentPos, setCurrentPos] = useState(0); // position within activeIndexes
  const [isFlipped, setIsFlipped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const [cardStatuses, setCardStatuses] = useState({}); // { [cardIndex]: "known"|"review" }
  const [markError, setMarkError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await getFlashcardSetRequest(flashcardSetId);
        setFlashcardSet(res.data.flashcardSet);
        setActiveIndexes(res.data.flashcardSet.cards.map((_, i) => i));
      } catch (err) {
        setLoadError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [flashcardSetId]);

  const currentCardIndex = activeIndexes[currentPos];
  const currentCard = flashcardSet?.cards[currentCardIndex];
  const isLastInSet = currentPos === activeIndexes.length - 1;

  const advanceOrComplete = () => {
    if (isLastInSet) {
      setIsComplete(true);
    } else {
      setCurrentPos((p) => p + 1);
      setIsFlipped(false);
    }
  };

  const handleMark = async (status) => {
    setMarkError("");
    setCardStatuses((prev) => ({ ...prev, [currentCardIndex]: status }));
    try {
      await submitFlashcardProgressRequest(flashcardSetId, currentCardIndex, status);
    } catch (err) {
      setMarkError(getErrorMessage(err));
    }
    advanceOrComplete();
  };

  const goToNext = () => {
    if (!isLastInSet) {
      setCurrentPos((p) => p + 1);
      setIsFlipped(false);
    }
  };

  const goToPrevious = () => {
    if (currentPos > 0) {
      setCurrentPos((p) => p - 1);
      setIsFlipped(false);
    }
  };

  const resetToFullSet = () => {
    setActiveIndexes(flashcardSet.cards.map((_, i) => i));
    setCurrentPos(0);
    setIsFlipped(false);
    setIsComplete(false);
  };

  const reviewDifficultOnly = () => {
    const difficultIndexes = Object.entries(cardStatuses)
      .filter(([, status]) => status === "review")
      .map(([index]) => Number(index));
    setActiveIndexes(difficultIndexes);
    setCurrentPos(0);
    setIsFlipped(false);
    setIsComplete(false);
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto animate-pulse">
        <div className="h-4 bg-neutral-100 rounded w-24 mb-6" />
        <div className="h-80 bg-neutral-100 rounded-2xl" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <p className="text-sm text-red-500">{loadError}</p>
        <Link to="/documents" className="text-violet-600 text-sm font-medium mt-4 inline-block hover:text-violet-700 transition-colors duration-200">
          Back to Documents
        </Link>
      </div>
    );
  }

  if (isComplete) {
    const known = Object.values(cardStatuses).filter((s) => s === "known").length;
    const review = Object.values(cardStatuses).filter((s) => s === "review").length;

    return (
      <div className="max-w-xl mx-auto">
        <FlashcardComplete
          progress={{ total: activeIndexes.length, known, review }}
          onRestart={resetToFullSet}
          onReviewDifficult={reviewDifficultOnly}
          onBackToDocument={() => navigate(`/documents/${flashcardSet.documentId}`)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link
          to={`/documents/${flashcardSet.documentId}`}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-violet-700 transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          Exit
        </Link>
        <button
          onClick={resetToFullSet}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-violet-700 transition-colors duration-200"
        >
          <RotateCcw size={14} />
          Restart
        </button>
      </div>

      <div className="mb-5 text-center">
        <h1 className="text-xl font-serif font-bold text-neutral-900">{flashcardSet.title}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {difficultyLabels[flashcardSet.difficulty]} · {flashcardSet.cardCount} Cards
        </p>
      </div>

      <FlashcardProgressBar current={currentPos} total={activeIndexes.length} />

      <div className="mt-6">
        <FlashcardCard
          card={currentCard}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped((f) => !f)}
        />
      </div>

      {markError && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {markError}
        </div>
      )}

      {!isFlipped ? (
        <button
          onClick={() => setIsFlipped(true)}
          className="w-full mt-4 rounded-xl border border-neutral-200 text-neutral-600 font-medium py-2.5 text-sm hover:bg-neutral-50 hover:border-violet-200 hover:text-violet-700 transition-all duration-200"
        >
          Show Answer
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => handleMark("known")}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-medium py-2.5 text-sm hover:bg-emerald-100 transition-colors duration-200"
          >
            <Check size={16} />
            I knew this
          </button>
          <button
            onClick={() => handleMark("review")}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-50 text-amber-700 font-medium py-2.5 text-sm hover:bg-amber-100 transition-colors duration-200"
          >
            <RefreshCcw size={14} />
            Need to review
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={goToPrevious}
          disabled={currentPos === 0}
          className="flex items-center gap-1.5 rounded-xl border border-neutral-200 text-neutral-600 font-medium px-4 py-2.5 text-sm hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <button
          onClick={goToNext}
          disabled={isLastInSet}
          className="flex items-center gap-1.5 rounded-xl border border-neutral-200 text-neutral-600 font-medium px-4 py-2.5 text-sm hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default FlashcardPage;