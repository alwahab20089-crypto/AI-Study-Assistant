import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, MoreVertical, Pencil, Trash2, FolderInput } from "lucide-react";
import formatFileSize from "../utils/formatFileSize.js";
import formatDate from "../utils/formatDate.js";

const fileTypeStyles = {
  pdf: "bg-gradient-to-br from-red-50 to-red-100 text-red-600 ring-1 ring-red-100",
  docx: "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 ring-1 ring-blue-100",
  txt: "bg-gradient-to-br from-neutral-100 to-neutral-200 text-neutral-600 ring-1 ring-neutral-200",
};

const DocumentCard = ({ document, onRename, onMove, onDelete }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group relative bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.1)] hover:border-violet-200">
      <div className="flex items-start justify-between">
        <div
          className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => navigate(`/documents/${document._id}`)}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${fileTypeStyles[document.fileType]}`}
          >
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-neutral-900 truncate transition-colors duration-200 group-hover:text-violet-700">
              {document.title}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5 uppercase tracking-wide">
              {document.fileType} • {formatFileSize(document.fileSize)}
            </p>
            <p className="text-xs text-violet-600 mt-1 font-medium">
              {document.subject?.name || "Uncategorized"}
            </p>
            <p className="text-xs text-neutral-400 mt-1.5">
              Uploaded {formatDate(document.createdAt)}
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors duration-200"
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-20 bg-white border border-neutral-200/70 rounded-xl shadow-[0_12px_32px_-8px_rgba(0,0,0,0.15)] py-1.5 w-48 origin-top-right">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(document);
                  }}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-neutral-600 hover:bg-violet-50 hover:text-violet-700 w-full text-left transition-colors duration-150"
                >
                  <Pencil size={14} /> Rename
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onMove(document);
                  }}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-neutral-600 hover:bg-violet-50 hover:text-violet-700 w-full text-left transition-colors duration-150"
                >
                  <FolderInput size={14} /> Move to Subject
                </button>
                <div className="my-1 border-t border-neutral-100" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(document);
                  }}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors duration-150"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;