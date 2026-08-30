import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import { getWeakTopicsRequest } from "../../services/progressService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";
import WeakTopicCard from "./WeakTopicCard.jsx";

const WeakTopicsSection = ({ limit, showViewAllLink = false }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getWeakTopicsRequest();
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
  }, []);

  const weakTopics = data?.weakTopics || [];
  const improvedTopics = data?.improvedTopics || [];
  const visibleWeakTopics = limit ? weakTopics.slice(0, limit) : weakTopics;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-6 transition-shadow duration-300 hover:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
          Areas to Review
        </h2>
        {showViewAllLink && weakTopics.length > 0 && (
          <Link to="/progress" className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors duration-200">
            View Progress
          </Link>
        )}
      </div>
      <p className="text-xs text-neutral-400 mb-4">
        Topics where recent quiz and study mode answers suggest extra review could help.
      </p>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">
          Unable to load areas to review. Please try again later.
        </p>
      ) : weakTopics.length === 0 ? (
        improvedTopics.length > 0 ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
            <p className="text-sm font-medium text-emerald-700 flex items-center gap-1.5">
              <PartyPopper size={16} /> Nice improvement!
            </p>
            <p className="text-sm text-emerald-600 mt-1">
              Your recent performance on{" "}
              {improvedTopics.map((t) => t.topic).join(", ")} has improved
              significantly. Keep practicing to reinforce it.
            </p>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            You're doing great so far! 🎉 Complete a few more quizzes and study
            sessions to see areas that may need extra review.
          </p>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleWeakTopics.map((topic) => (
            <WeakTopicCard
              key={`${topic.topic}-${topic.documentId || "none"}`}
              topic={topic}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WeakTopicsSection;