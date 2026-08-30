import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layers, ArrowRight } from "lucide-react";
import { listFlashcardSetsRequest } from "../../services/flashcardService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";
import FlashcardSetHistoryItem from "../../components/flashcards/FlashcardSetHistoryItem.jsx";

const FlashcardsLibraryPage = () => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFlashcardSets = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await listFlashcardSetsRequest();

        setFlashcardSets(res.data.flashcardSets || []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcardSets();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 bg-neutral-100 rounded w-48 mb-6 animate-pulse" />

        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-24 bg-neutral-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-neutral-900 tracking-tight">
          Flashcards
        </h1>

        <p className="text-sm text-neutral-500 mt-1">
          View and continue flashcard sets you have generated.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!error && flashcardSets.length === 0 && (
        <div className="bg-white border border-neutral-200/70 rounded-2xl p-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <Layers
            size={40}
            className="mx-auto text-violet-300 mb-3"
          />

          <h2 className="font-serif font-semibold text-neutral-900">
            No flashcards yet
          </h2>

          <p className="text-sm text-neutral-500 mt-1">
            Generate a flashcard set from one of your documents to see it here.
          </p>

          <Link
            to="/documents"
            className="inline-flex items-center gap-2 mt-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200"
          >
            Browse Documents
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Flashcard History */}
      {flashcardSets.length > 0 && (
        <div className="space-y-3">
          {flashcardSets.map((flashcardSet) => (
            <FlashcardSetHistoryItem
              key={flashcardSet.id}
              flashcardSet={flashcardSet}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardsLibraryPage;