import { useState, useEffect } from "react";
import GoalsSection from "../../components/goals/GoalsSection.jsx";
import {
  getOverviewRequest,
  getQuizPerformanceRequest,
  getWeeklyActivityRequest,
  getDocumentProgressRequest,
  getFlashcardProgressRequest,
  getStudySessionStatsRequest,
} from "../../services/progressService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";
import StatCard from "../../components/StatCard.jsx";
import QuizPerformanceChart from "../../components/progress/QuizPerformanceChart.jsx";
import WeeklyActivityChart from "../../components/progress/WeeklyActivityChart.jsx";
import DocumentProgressList from "../../components/progress/DocumentProgressList.jsx";
import FlashcardProgressCard from "../../components/progress/FlashcardProgressCard.jsx";
import StudySessionStatsCard from "../../components/progress/StudySessionStatsCard.jsx";
import WeakTopicsSection from "../../components/progress/WeakTopicsSection.jsx";

const useProgressSection = (requestFn) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await requestFn();
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error };
};

const SectionCard = ({ title, caption, loading, error, empty, children }) => (
  <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6 transition-shadow duration-300 hover:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.1)]">
    <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">{title}</h2>
    {caption ? (
      <p className="text-xs text-neutral-400 mt-1 mb-4">{caption}</p>
    ) : (
      <div className="mb-4" />
    )}
    {loading ? (
      <div className="h-24 bg-neutral-100 rounded-xl animate-pulse" />
    ) : error ? (
      <p className="text-sm text-red-500">{error}</p>
    ) : empty ? (
      <p className="text-sm text-neutral-500">{empty}</p>
    ) : (
      children
    )}
  </div>
);

const ProgressPage = () => {
  const overview = useProgressSection(getOverviewRequest);
  const quizPerf = useProgressSection(getQuizPerformanceRequest);
  const weekly = useProgressSection(getWeeklyActivityRequest);
  const documents = useProgressSection(getDocumentProgressRequest);
  const flashcards = useProgressSection(getFlashcardProgressRequest);
  const studySessions = useProgressSection(getStudySessionStatsRequest);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-neutral-900 tracking-tight">Progress</h1>
        <p className="text-neutral-500 mt-1.5">A detailed look at your study activity.</p>
      </div>
      <GoalsSection />

      <SectionCard title="Overview" loading={overview.loading} error={overview.error && "Unable to load overview."}>
        {overview.data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Documents" value={overview.data.overview.totalDocuments} />
            <StatCard label="Quizzes" value={overview.data.overview.totalQuizzes} />
            <StatCard label="Study Sessions" value={overview.data.overview.totalStudySessions} />
            <StatCard label="Flashcards Reviewed" value={overview.data.overview.totalFlashcardsReviewed} />
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Quiz Performance"
        loading={quizPerf.loading}
        error={quizPerf.error && "Unable to load quiz performance."}
        empty={
          quizPerf.data && quizPerf.data.performance.totalAttempts === 0
            ? "No quiz data yet. Take your first quiz to start tracking your progress."
            : null
        }
      >
        {quizPerf.data && (
          <>
            <p className="text-sm text-neutral-600 mb-4">
              Average: <span className="font-semibold text-neutral-900">{quizPerf.data.performance.averageScore}%</span>
              {" · "}Highest: {quizPerf.data.performance.highestScore}%
              {" · "}Lowest: {quizPerf.data.performance.lowestScore}%
            </p>
            <QuizPerformanceChart history={quizPerf.data.history} />
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Weekly Activity"
        caption="Quizzes taken, flashcards reviewed, and study sessions started, per day, for the last 7 days."
        loading={weekly.loading}
        error={weekly.error && "Unable to load weekly activity."}
      >
        {weekly.data && <WeeklyActivityChart days={weekly.data.days} />}
      </SectionCard>

      <SectionCard
        title="Flashcard Progress"
        loading={flashcards.loading}
        error={flashcards.error && "Unable to load flashcard progress."}
      >
        {flashcards.data && <FlashcardProgressCard flashcards={flashcards.data.flashcards} />}
      </SectionCard>

      <SectionCard
        title="Study Sessions"
        loading={studySessions.loading}
        error={studySessions.error && "Unable to load study session stats."}
      >
        {studySessions.data && <StudySessionStatsCard stats={studySessions.data.studySessions} />}
      </SectionCard>

      <SectionCard
        title="Study Activity by Document"
        caption="Study Activity is a simple 0–100 blend of quiz attempts, study sessions, and flashcards reviewed for each document — not a measure of how well you know the material."
        loading={documents.loading}
        error={documents.error && "Unable to load document progress."}
        empty={
          documents.data && documents.data.documents.length === 0
            ? "No documents studied yet. Upload a document to start tracking progress."
            : null
        }
      >
        {documents.data && <DocumentProgressList documents={documents.data.documents} />}
      </SectionCard>

      <WeakTopicsSection />
    </div>
  );
};

export default ProgressPage;