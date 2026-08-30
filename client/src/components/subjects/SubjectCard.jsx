import { useNavigate } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";

const SubjectCard = ({ subject }) => {
  const navigate = useNavigate();

  return (
    <div className="group bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_rgba(109,40,217,0.15)] hover:border-violet-200">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center mb-3.5 ring-1 ring-violet-100 transition-transform duration-300 group-hover:scale-105">
        <BookOpen size={18} />
      </div>
      <h3 className="font-serif font-semibold text-neutral-900 truncate">{subject.name}</h3>
      {subject.description && (
        <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{subject.description}</p>
      )}
      <p className="text-xs text-neutral-400 mt-3">
        {subject.documentCount} {subject.documentCount === 1 ? "document" : "documents"}
      </p>
      <button
        onClick={() => navigate(`/subjects/${subject.id}`)}
        className="group/btn mt-4 w-full flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 text-neutral-700 font-medium py-2.5 text-sm hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all duration-250"
      >
        Open
        <ArrowRight size={14} className="transition-transform duration-250 group-hover/btn:translate-x-0.5" />
      </button>
    </div>
  );
};

export default SubjectCard;