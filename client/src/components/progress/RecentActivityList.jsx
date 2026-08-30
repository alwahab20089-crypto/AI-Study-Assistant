import { HelpCircle, Layers, GraduationCap, FileText, Upload } from "lucide-react";
import formatDate from "../../utils/formatDate.js";

const ACTIVITY_CONFIG = {
  document_uploaded: { icon: Upload, label: (a) => `Uploaded ${a.documentTitle}`, detail: () => null },
  quiz_completed: {
    icon: HelpCircle,
    label: (a) => `Completed ${a.documentTitle} quiz`,
    detail: (a) => `Score: ${a.score}%`,
  },
  flashcards_reviewed: {
    icon: Layers,
    label: (a) => `Reviewed ${a.documentTitle} flashcards`,
    detail: (a) => `${a.cardsReviewed} cards`,
  },
  study_session_completed: {
    icon: GraduationCap,
    label: (a) => `Completed ${a.documentTitle} study session`,
    detail: (a) => `${a.questionsCorrect}/${a.questionsAsked} correct`,
  },
  summary_generated: {
    icon: FileText,
    label: (a) => `Generated a ${a.length} summary for ${a.documentTitle}`,
    detail: () => null,
  },
};

const RecentActivityList = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No activity yet. Upload a document and start studying to see it here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => {
        const config = ACTIVITY_CONFIG[activity.type];
        if (!config) return null;
        const Icon = config.icon;
        const detail = config.detail(activity);

        return (
          <div key={index} className="group flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center shrink-0 ring-1 ring-violet-100 transition-transform duration-300 group-hover:scale-105">
              <Icon size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-neutral-800">{config.label(activity)}</p>
              {detail && <p className="text-xs text-neutral-400 mt-0.5">{detail}</p>}
              <p className="text-xs text-neutral-300 mt-0.5">{formatDate(activity.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentActivityList;