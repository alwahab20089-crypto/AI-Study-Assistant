import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, ArrowRight, FileText } from "lucide-react";
import { listQuizzesRequest } from "../../services/quizService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";

const QuizHistoryPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await listQuizzesRequest();
        setQuizzes(res.data.quizzes || []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
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
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-neutral-900 tracking-tight">
          Quiz History
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          View and continue quizzes you have generated.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!error && quizzes.length === 0 && (
        <div className="bg-white border border-neutral-200/70 rounded-2xl p-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <HelpCircle
            size={40}
            className="mx-auto text-violet-300 mb-3"
          />

          <h2 className="font-serif font-semibold text-neutral-900">
            No quizzes yet
          </h2>

          <p className="text-sm text-neutral-500 mt-1">
            Generate a quiz from one of your documents to see it here.
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

      <div className="space-y-3">
        {quizzes.map((quiz) => (
          <Link
            key={quiz.id}
            to={`/quizzes/${quiz.id}`}
            className="group block bg-white border border-neutral-200/70 rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.1)]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center shrink-0 ring-1 ring-violet-100 transition-transform duration-300 group-hover:scale-105">
                  <HelpCircle size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-neutral-900 transition-colors duration-200 group-hover:text-violet-700">
                    {quiz.title || "Untitled Quiz"}
                  </h2>

                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                    <FileText size={13} />
                    <span>
                      {quiz.document?.title || "Document"}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 mt-1">
                    {quiz.questionCount || quiz.questions?.length || 0} questions
                    {" · "}
                    {quiz.difficulty || "medium"}
                  </p>
                </div>
              </div>

              <ArrowRight
                size={18}
                className="text-neutral-300 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-violet-400"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuizHistoryPage;