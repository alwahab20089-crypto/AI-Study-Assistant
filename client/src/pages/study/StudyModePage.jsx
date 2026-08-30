import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, GraduationCap, PartyPopper } from "lucide-react";
import {
  getStudySessionRequest,
  submitStudyAnswerRequest,
  abandonStudySessionRequest,
} from "../../services/studyService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";
import ChatBubble from "../../components/ChatBubble.jsx";
import ChatTypingIndicator from "../../components/ChatTypingIndicator.jsx";
import FeedbackCard from "../../components/study/FeedbackCard.jsx";
import AnswerInput from "../../components/study/AnswerInput.jsx";
import StudyProgress from "../../components/study/StudyProgress.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";

const StudyModePage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [turns, setTurns] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [justCompleted, setJustCompleted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await getStudySessionRequest(sessionId);
        setSession(res.data.session);
        setCurrentQuestion(res.data.currentQuestion || "");
        setTurns(res.data.turns || []);

        if (res.data.session.status === "completed") {
          navigate(`/study/session/${sessionId}/result`, { replace: true });
        }
      } catch (err) {
        setLoadError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, submitting, currentQuestion]);

  const handleSubmitAnswer = async (answer) => {
    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await submitStudyAnswerRequest(sessionId, answer);
      const { evaluation, nextQuestion, session: updatedSession } = res.data;

      setTurns((prev) => [
        ...prev,
        {
          question: currentQuestion,
          studentAnswer: answer,
          correctness: evaluation.correctness,
          feedback: evaluation.feedback,
          explanation: evaluation.explanation,
        },
      ]);
      setSession(updatedSession);

      if (updatedSession.status === "completed") {
        setCurrentQuestion("");
        setJustCompleted(true);
      } else {
        setCurrentQuestion(nextQuestion || "");
      }
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleExitClick = () => {
    if (session?.status === "active") {
      setExiting(true);
    } else {
      navigate(`/documents/${session.document?.id || session.document}`);
    }
  };

  const handleConfirmExit = async () => {
    setIsAbandoning(true);
    try {
      await abandonStudySessionRequest(sessionId);
      navigate(`/documents/${session.document?.id || session.document}`);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setIsAbandoning(false);
      setExiting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-4 bg-neutral-100 rounded w-24 mb-6" />
        <div className="h-96 bg-neutral-100 rounded-2xl" />
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

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <div className="shrink-0">
        <button
          onClick={handleExitClick}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-violet-700 mb-4 transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          Exit
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center shrink-0 ring-1 ring-violet-100">
            <GraduationCap size={16} />
          </div>
          <div>
            <h1 className="font-serif font-semibold text-neutral-900">AI Tutor</h1>
            <p className="text-xs text-neutral-400 capitalize">{session.difficulty} difficulty</p>
          </div>
        </div>

        <StudyProgress
          questionsAsked={session.questionsAsked}
          questionLimit={session.questionLimit}
          correct={session.questionsCorrect}
          partial={session.questionsPartiallyCorrect}
          incorrect={session.questionsIncorrect}
        />
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden mt-4">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {turns.map((turn, index) => (
            <div key={index} className="space-y-4">
              <ChatBubble role="assistant" content={turn.question} />
              <ChatBubble role="user" content={turn.studentAnswer} />
              <FeedbackCard
                correctness={turn.correctness}
                feedback={turn.feedback}
                explanation={turn.explanation}
              />
            </div>
          ))}

          {currentQuestion && <ChatBubble role="assistant" content={currentQuestion} />}

          {submitting && <ChatTypingIndicator />}

          {justCompleted && (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center mb-3 ring-1 ring-violet-100">
                <PartyPopper size={20} />
              </div>
              <p className="text-sm font-medium text-neutral-700 mb-4">
                You've finished this study session.
              </p>
              <button
                onClick={() => navigate(`/study/session/${sessionId}/result`)}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium px-5 py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200"
              >
                See Results
              </button>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {!justCompleted && (
          <div className="border-t border-neutral-100 p-4 shrink-0">
            {submitError && (
              <div className="mb-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
                {submitError}
              </div>
            )}
            <AnswerInput onSubmit={handleSubmitAnswer} disabled={submitting || !currentQuestion} />
          </div>
        )}
      </div>

      {exiting && (
        <ConfirmDialog
          title="Leave study session?"
          message="Your current progress will be saved."
          confirmLabel="Leave"
          confirmingLabel="Leaving..."
          onConfirm={handleConfirmExit}
          onCancel={() => setExiting(false)}
          isConfirming={isAbandoning}
        />
      )}
    </div>
  );
};

export default StudyModePage;