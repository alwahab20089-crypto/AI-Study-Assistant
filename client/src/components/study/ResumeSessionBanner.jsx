import { BookOpen } from "lucide-react";

const ResumeSessionBanner = ({ session, onResume, onStartNew }) => {
  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50/60 border border-violet-100 rounded-2xl p-5 mb-6 transition-shadow duration-300 hover:shadow-[0_8px_24px_-10px_rgba(109,40,217,0.2)]">
      <div className="flex items-center gap-2.5 mb-1">
        <BookOpen size={18} className="text-violet-600" />
        <h2 className="font-serif font-semibold text-violet-900">Unfinished study session</h2>
      </div>
      <p className="text-sm text-violet-700 mb-4">
        Question {session.questionsAsked + 1} of {session.questionLimit} · {session.difficulty}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onResume}
          className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium py-2.5 text-sm hover:shadow-lg hover:shadow-violet-300/50 transition-all duration-200"
        >
          Resume
        </button>
        <button
          onClick={onStartNew}
          className="flex-1 rounded-xl border border-violet-200 text-violet-700 font-medium py-2.5 text-sm hover:bg-violet-100/60 transition-colors duration-200"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
};

export default ResumeSessionBanner;