import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SummaryContent = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-neutral-900 prose-headings:font-semibold prose-p:text-neutral-700 prose-li:text-neutral-700 prose-strong:text-neutral-900 prose-a:text-violet-600">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
};

export default SummaryContent;