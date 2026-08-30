import { Bot, User } from "lucide-react";

const ChatBubble = ({ role, content, sources }) => {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white"
            : "bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 ring-1 ring-violet-100"
        }`}
      >
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
            isUser
              ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm shadow-sm shadow-violet-200"
              : "bg-neutral-100 text-neutral-800 rounded-tl-sm"
          }`}
        >
          {content}
        </div>

        {!isUser && sources && sources.length > 0 && (
          <p className="text-xs text-neutral-400 mt-1.5 px-1">
            Sources: {sources.length} excerpt{sources.length > 1 ? "s" : ""} from this document
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;