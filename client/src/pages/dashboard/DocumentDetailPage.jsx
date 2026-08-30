import { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, Sparkles, MessageSquare } from "lucide-react";
import {
  getDocumentByIdRequest,
  updateDocumentRequest,
  deleteDocumentRequest,
} from "../../services/documentService.js";
import {
  generateSummaryRequest,
  getSummariesRequest,
  deleteSummaryRequest,
} from "../../services/summaryService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";
import formatFileSize from "../../utils/formatFileSize.js";
import formatDate from "../../utils/formatDate.js";
import RenameModal from "../../components/RenameModal.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import SummaryGenerator from "../../components/summaries/SummaryGenerator.jsx";
import SummaryCard from "../../components/summaries/SummaryCard.jsx";
import SummarySkeleton from "../../components/summaries/SummarySkeleton.jsx";
import { generateQuizRequest, listQuizzesRequest } from "../../services/quizService.js";
import QuizGenerator from "../../components/quizzes/QuizGenerator.jsx";
import QuizHistoryItem from "../../components/quizzes/QuizHistoryItem.jsx";
import { generateFlashcardsRequest, listFlashcardSetsRequest } from "../../services/flashcardService.js";
import FlashcardGenerator from "../../components/flashcards/FlashcardGenerator.jsx";
import FlashcardSetHistoryItem from "../../components/flashcards/FlashcardSetHistoryItem.jsx";

const GENERATING_MESSAGES = {
  idle: "",
  start: "Analyzing document...",
};

const DocumentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusTopic = searchParams.get("topic") || "";

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [renaming, setRenaming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Summaries
  const [summaries, setSummaries] = useState([]);
  const [summariesLoading, setSummariesLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [generatingLength, setGeneratingLength] = useState(null); // which length is currently generating
  const [deletingSummaryId, setDeletingSummaryId] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [quizError, setQuizError] = useState("");
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [flashcardSetsLoading, setFlashcardSetsLoading] = useState(true);
  const [flashcardError, setFlashcardError] = useState("");
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);

  useEffect(() => {
    const fetchFlashcardSets = async () => {
      setFlashcardSetsLoading(true);
      try {
        const res = await listFlashcardSetsRequest(id);
        setFlashcardSets(res.data.flashcardSets);
      } catch (err) {
        setFlashcardError(getErrorMessage(err));
      } finally {
        setFlashcardSetsLoading(false);
      }
    };
    fetchFlashcardSets();
  }, [id]);

  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getDocumentByIdRequest(id);
        setDocument(res.data.document);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchDocument();
  }, [id]);

  useEffect(() => {
    const fetchSummaries = async () => {
      setSummariesLoading(true);
      try {
        const res = await getSummariesRequest(id);
        setSummaries(res.data.summaries);
      } catch (err) {
        // Non-fatal — summaries are secondary to the document itself
        setSummaryError(getErrorMessage(err));
      } finally {
        setSummariesLoading(false);
      }
    };
    fetchSummaries();
  }, [id]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setQuizzesLoading(true);
      try {
        const res = await listQuizzesRequest(id);
        setQuizzes(res.data.quizzes);
      } catch (err) {
        setQuizError(getErrorMessage(err));
      } finally {
        setQuizzesLoading(false);
      }
    };
    fetchQuizzes();
  }, [id]);

  const handleGenerateQuiz = async (questionCount, difficulty) => {
    setGeneratingQuiz(true);
    setQuizError("");
    try {
      const res = await generateQuizRequest(id, questionCount, difficulty, focusTopic || undefined);
      navigate(`/quizzes/${res.data.quiz.id}`);
    } catch (err) {
      setQuizError(getErrorMessage(err));
      setGeneratingQuiz(false);
    }
  };

  const handleRenameSave = async (docId, data) => {
    setIsSaving(true);
    try {
      const res = await updateDocumentRequest(docId, data);
      setDocument((prev) => ({ ...prev, ...res.data.document }));
      setRenaming(false);
      return { success: true };
    } catch (err) {
      return { success: false, message: getErrorMessage(err) };
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteDocumentRequest(id);
      navigate("/documents", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setIsDeleting(false);
      setDeleting(false);
    }
  };

  const handleGenerateSummary = async (length, regenerate = false) => {
    setGeneratingLength(length);
    setSummaryError("");
    try {
      const res = await generateSummaryRequest(id, length, regenerate);
      setSummaries((prev) => {
        const withoutThisLength = prev.filter((s) => s.length !== length);
        return [res.data.summary, ...withoutThisLength];
      });
    } catch (err) {
      setSummaryError(getErrorMessage(err));
    } finally {
      setGeneratingLength(null);
    }
  };

  const handleDeleteSummary = async (summaryId) => {
    setDeletingSummaryId(summaryId);
    setSummaryError("");
    try {
      await deleteSummaryRequest(summaryId);
      setSummaries((prev) => prev.filter((s) => s.id !== summaryId));
    } catch (err) {
      setSummaryError(getErrorMessage(err));
    } finally {
      setDeletingSummaryId(null);
    }
  };

  const handleGenerateFlashcards = async (cardCount, difficulty) => {
    setGeneratingFlashcards(true);
    setFlashcardError("");
    try {
      const res = await generateFlashcardsRequest(id, cardCount, difficulty);
      navigate(`/flashcards/${res.data.flashcardSet.id}`);
    } catch (err) {
      setFlashcardError(getErrorMessage(err));
      setGeneratingFlashcards(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-4 bg-neutral-100 rounded w-24 mb-6" />
        <div className="h-8 bg-neutral-100 rounded w-1/2 mb-4" />
        <div className="h-4 bg-neutral-100 rounded w-1/3 mb-8" />
        <div className="h-64 bg-neutral-100 rounded-2xl" />
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-sm text-red-500">{error}</p>
        <Link to="/documents" className="text-violet-600 text-sm font-medium mt-4 inline-block hover:text-violet-700 transition-colors duration-200">
          Back to Documents
        </Link>
      </div>
    );
  }

  const isReady = document.processingStatus === "ready";

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/documents"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-violet-700 mb-6 transition-colors duration-200"
      >
        <ArrowLeft size={16} />
        Back to Documents
      </Link>

      {error && (
        <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center shrink-0 ring-1 ring-violet-100">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-neutral-900">{document.title}</h1>
              <p className="text-sm text-neutral-500 mt-1 uppercase tracking-wide">
                {document.fileType} · {formatFileSize(document.fileSize)}
              </p>
              <p className="text-sm text-violet-600 mt-1 font-medium">
                {document.subject?.name || "Uncategorized"}
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                Uploaded {formatDate(document.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setRenaming(true)}
              className="rounded-xl border border-neutral-200 text-neutral-600 font-medium px-4 py-2 text-sm hover:bg-neutral-50 hover:border-violet-200 hover:text-violet-700 transition-all duration-200"
            >
              Rename
            </button>
            <button
              onClick={() => setDeleting(true)}
              className="rounded-xl border border-red-100 text-red-500 font-medium px-4 py-2 text-sm hover:bg-red-50 transition-colors duration-200"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Subject
          </p>
          <p className="text-sm text-neutral-700 mt-1">
            {document.subject?.name || "Uncategorized"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6 mt-6">
        <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-4">
          Document Content
        </h2>
        <div className="prose prose-sm max-w-none text-neutral-700 whitespace-pre-wrap leading-relaxed max-h-[28rem] overflow-y-auto pr-2">
          {document.extractedText}
        </div>
      </div>

      {/* AI Study Tools */}
      <div className="mt-6 space-y-4">
        {isReady ? (
          <>
            <Link
              to={`/chat/${document._id}`}
              className="group flex items-center gap-3 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-5 text-white transition-all duration-300 hover:shadow-lg hover:shadow-violet-300/40 hover:-translate-y-0.5"
            >
              <MessageSquare size={20} className="transition-transform duration-300 group-hover:scale-110" />
              <div>
                <h3 className="font-semibold text-sm">Chat with this document</h3>
                <p className="text-xs text-violet-100 mt-0.5">
                  Ask questions grounded in your uploaded material
                </p>
              </div>
            </Link>
            <Link
              to={`/study/${document._id}`}
              className="group flex items-center gap-3 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 text-white transition-all duration-300 hover:shadow-lg hover:shadow-emerald-300/40 hover:-translate-y-0.5"
            >
              <GraduationCap size={20} className="transition-transform duration-300 group-hover:scale-110" />
              <div>
                <h3 className="font-semibold text-sm">Study Mode</h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Practice with an AI tutor that quizzes you interactively
                </p>
              </div>
            </Link>

            {summaryError && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {summaryError}
              </div>
            )}

            <SummaryGenerator
              onGenerate={(length) => handleGenerateSummary(length, false)}
              isGenerating={generatingLength !== null}
            />

            {generatingLength && (
              <SummarySkeleton message={GENERATING_MESSAGES.start} />
            )}

            {!summariesLoading &&
              summaries
                .filter((s) => s.length !== generatingLength)
                .map((summary) => (
                  <SummaryCard
                    key={summary.id}
                    summary={summary}
                    onRegenerate={(length) => handleGenerateSummary(length, true)}
                    onDelete={handleDeleteSummary}
                    isRegenerating={generatingLength === summary.length}
                    isDeleting={deletingSummaryId === summary.id}
                  />
                ))}
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-3">
                Quiz
              </h3>

              {quizError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  {quizError}
                </div>
              )}

              {focusTopic && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-violet-50 border border-violet-100 px-4 py-2.5 text-sm text-violet-700">
                  <span>
                    Practice quiz will focus on: <strong>{focusTopic}</strong>
                  </span>
                  <button
                    onClick={() => setSearchParams({})}
                    className="text-xs font-medium text-violet-500 hover:text-violet-700 shrink-0 transition-colors duration-200"
                  >
                    Clear
                  </button>
                </div>
              )}

              <QuizGenerator onGenerate={handleGenerateQuiz} isGenerating={generatingQuiz} />

              {!quizzesLoading && quizzes.length > 0 && (
                <div className="mt-4 space-y-2.5">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide px-1">
                    Quiz History
                  </p>
                  {quizzes.map((quiz) => (
                    <QuizHistoryItem key={quiz.id} quiz={quiz} />
                  ))}
                </div>
              )}
            </div>
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-3">
                Flashcards
              </h3>

              {flashcardError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  {flashcardError}
                </div>
              )}

              <FlashcardGenerator onGenerate={handleGenerateFlashcards} isGenerating={generatingFlashcards} />

              {!flashcardSetsLoading && flashcardSets.length > 0 && (
                <div className="mt-4 space-y-2.5">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide px-1">
                    Flashcard Sets
                  </p>
                  {flashcardSets.map((set) => (
                    <FlashcardSetHistoryItem key={set.id} flashcardSet={set} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-neutral-100 rounded-2xl p-6 text-neutral-500">
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} className="text-violet-600" />
              <h2 className="font-serif font-semibold text-neutral-800">
                {document.processingStatus === "processing"
                  ? "Preparing this document for AI tools..."
                  : "This document couldn't be indexed for AI tools"}
              </h2>
            </div>
            <p className="text-sm mt-1.5">
              {document.processingStatus === "processing"
                ? "This usually only takes a moment."
                : "Try re-uploading the document."}
            </p>
          </div>
        )}
      </div>

      {renaming && (
        <RenameModal
          document={document}
          onClose={() => setRenaming(false)}
          onSave={handleRenameSave}
          isSaving={isSaving}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete document?"
          message={`"${document.title}" will be permanently deleted. This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleting(false)}
          isConfirming={isDeleting}
        />
      )}
    </div>
  );
};

export default DocumentDetailPage;