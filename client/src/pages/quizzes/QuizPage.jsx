import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { getQuizRequest, submitQuizRequest } from "../../services/quizService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";
import QuizProgress from "../../components/quizzes/QuizProgress.jsx";
import QuizQuestion from "../../components/quizzes/QuizQuestion.jsx";

const difficultyLabels = { easy: "Easy", medium: "Medium", hard: "Hard" };

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionIndex]: selectedOptionIndex }

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await getQuizRequest(quizId);
        setQuiz(res.data.quiz);
      } catch (err) {
        setLoadError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quizId]);

  const handleSelect = (optionIndex) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitting(true);
    try {
      const answersArray = quiz.questions.map((_, i) => (answers[i] ?? -1));
      const res = await submitQuizRequest(quizId, answersArray);
      console.log("QUIZ SUBMIT RESPONSE:", res.data);

      navigate(`/quizzes/${quizId}/result`, {
        state: { result: res.data.result, quiz, review: res.data.review },
        replace: true,
      });
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-4 bg-neutral-100 rounded w-24 mb-6" />
        <div className="h-72 bg-neutral-100 rounded-2xl" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-sm text-red-500">{loadError}</p>
        <Link to="/documents" className="text-violet-600 text-sm font-medium mt-4 inline-block hover:text-violet-700 transition-colors duration-200">
          Back to Documents
        </Link>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const isLastQuestion = currentIndex === quiz.questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === quiz.questions.length;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to={`/documents/${quiz.documentId}`}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-violet-700 mb-4 transition-colors duration-200"
      >
        <ArrowLeft size={16} />
        Exit quiz
      </Link>

      <div className="mb-5">
        <h1 className="text-xl font-serif font-bold text-neutral-900">{quiz.title}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {difficultyLabels[quiz.difficulty]} · {quiz.questionCount} Questions
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6">
        <div className="mb-6">
          <QuizProgress
            current={currentIndex}
            total={quiz.questions.length}
            answeredCount={answeredCount}
          />
        </div>

        <QuizQuestion
          question={currentQuestion}
          selectedAnswer={answers[currentIndex]}
          onSelect={handleSelect}
        />

        {submitError && (
          <div className="mt-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-100">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 text-neutral-600 font-medium px-4 py-2.5 text-sm hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium px-5 py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium px-4 py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200"
            >
              Next
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {isLastQuestion && !allAnswered && (
          <p className="text-xs text-amber-600 text-center mt-3">
            Answer all questions before submitting.
          </p>
        )}
      </div>
    </div>
  );
};

export default QuizPage;