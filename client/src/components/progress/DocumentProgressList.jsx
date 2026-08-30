import { Link } from "react-router-dom";
import formatDate from "../../utils/formatDate.js";

const DocumentProgressList = ({ documents }) => {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No documents studied yet. Upload a document to start tracking progress.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {documents.map((doc) => (
        <Link key={doc.documentId} to={`/documents/${doc.documentId}`} className="block group">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-medium text-neutral-900 transition-colors duration-200 group-hover:text-violet-700">
              {doc.title}
            </p>
            <span className="text-xs text-neutral-400">{doc.studyActivityPercent}%</span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${doc.studyActivityPercent}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs text-neutral-500">
            <span>Quiz Average: {doc.averageQuizScore !== null ? `${doc.averageQuizScore}%` : "—"}</span>
            <span>Study Sessions: {doc.studySessions}</span>
            <span>Flashcards Reviewed: {doc.flashcardsReviewed}</span>
            <span>Last Studied: {doc.lastStudiedAt ? formatDate(doc.lastStudiedAt) : "Never"}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default DocumentProgressList;