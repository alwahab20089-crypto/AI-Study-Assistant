import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import QuizReview from "../../components/quizzes/QuizReview.jsx";

const QuizResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, quiz, review } = location.state || {};

  const [showReview, setShowReview] = useState(false);

  // No result in navigation state — most likely a page refresh, which this
  // MVP doesn't support restoring (see known limitations). Redirect rather
  // than show a broken page.
  if (!result || !quiz) {
    return <Navigate to="/documents" replace />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {!showReview ? (
        <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center mx-auto mb-4 ring-1 ring-violet-100">
            <PartyPopper size={24} />
          </div>
          <h1 className="text-xl font-serif font-bold text-neutral-900">Quiz Complete 🎉</h1>
          <p className="text-sm text-neutral-500 mt-1">{quiz.title}</p>

          <div className="mt-8">
            <p className="text-4xl font-serif font-bold text-neutral-900">
              {result.score} / {result.totalQuestions}
            </p>
            <p className="text-lg font-semibold mt-1 bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              {result.percentage}%
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 mt-6 text-sm">
            <span className="text-emerald-600 font-medium">Correct: {result.correct}</span>
            <span className="text-red-500 font-medium">Incorrect: {result.incorrect}</span>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={() => setShowReview(true)}
              className="flex-1 rounded-xl border border-neutral-200 text-neutral-700 font-medium py-2.5 text-sm hover:bg-neutral-50 transition-colors duration-200"
            >
              Review Answers
            </button>
            <button
              onClick={() => navigate(`/documents/${quiz.documentId}`)}
              className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200"
            >
              Back to Document
            </button>
          </div>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setShowReview(false)}
            className="text-sm text-violet-600 font-medium mb-5 hover:text-violet-700 transition-colors duration-200"
          >
            ← Back to results
          </button>
          <QuizReview review={review} />
          <button
            onClick={() => navigate(`/documents/${quiz.documentId}`)}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200 mt-2"
          >
            Back to Document
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizResult;