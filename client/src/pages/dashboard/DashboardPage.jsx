import { useState, useEffect } from "react";
import GoalsSection from "../../components/goals/GoalsSection.jsx";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import StatCard from "../../components/StatCard.jsx";
import {
  getOverviewRequest,
  getActivityRequest,
  getQuizPerformanceRequest,
} from "../../services/progressService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";
import RecentActivityList from "../../components/progress/RecentActivityList.jsx";
import WeakTopicsSection from "../../components/progress/WeakTopicsSection.jsx";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const DashboardPage = () => {
  const { user } = useAuth();

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");

  const [performance, setPerformance] = useState(null);
  const [performanceLoading, setPerformanceLoading] = useState(true);
  const [performanceError, setPerformanceError] = useState("");

  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    const load = async () => {
      setOverviewLoading(true);
      setOverviewError("");
      try {
        const res = await getOverviewRequest();
        setOverview(res.data.overview);
      } catch (err) {
        setOverviewError(getErrorMessage(err));
      } finally {
        setOverviewLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      setPerformanceLoading(true);
      setPerformanceError("");
      try {
        const res = await getQuizPerformanceRequest();
        setPerformance(res.data.performance);
      } catch (err) {
        setPerformanceError(getErrorMessage(err));
      } finally {
        setPerformanceLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      setActivityLoading(true);
      setActivityError("");
      try {
        const res = await getActivityRequest(5);
        setActivities(res.data.activities);
      } catch (err) {
        setActivityError(getErrorMessage(err));
      } finally {
        setActivityLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-neutral-900 tracking-tight">
        {getGreeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
      </h1>
      <p className="text-neutral-500 mt-1.5">Here's your study progress.</p>

      <div className="mt-6">
        <GoalsSection />
      </div>

      {overviewError && (
        <div className="mt-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {overviewError}
        </div>
      )}

      {overviewLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <StatCard label="Documents" value={overview.totalDocuments} />
            <StatCard label="Quizzes Completed" value={overview.totalQuizAttempts} />
            <StatCard label="Study Sessions" value={overview.totalStudySessions} />
            <StatCard label="Flashcards Reviewed" value={overview.totalFlashcardsReviewed} />
          </div>
        )
      )}

      <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6 mt-6 transition-shadow duration-300 hover:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.1)]">
        <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-4">
          Quiz Performance
        </h2>
        {performanceLoading ? (
          <div className="h-10 bg-neutral-100 rounded animate-pulse w-32" />
        ) : performanceError ? (
          <p className="text-sm text-red-500">Unable to load quiz performance.</p>
        ) : performance.totalAttempts === 0 ? (
          <p className="text-sm text-neutral-500">
            No quiz data yet. Take your first quiz to start tracking your progress.
          </p>
        ) : (
          <p className="text-2xl font-serif font-bold text-neutral-900">
            Average Score:{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              {performance.averageScore}%
            </span>
          </p>
        )}
      </div>

      <div className="mt-6">
        <WeakTopicsSection limit={3} showViewAllLink />
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6 mt-6 transition-shadow duration-300 hover:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
            Recent Activity
          </h2>
          <Link to="/progress" className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors duration-200">
            View all activity
          </Link>
        </div>
        {activityLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-neutral-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activityError ? (
          <p className="text-sm text-red-500">Unable to load recent activity.</p>
        ) : (
          <RecentActivityList activities={activities} />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;