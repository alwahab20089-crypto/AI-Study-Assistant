import { Bot } from "lucide-react";

const ChatTypingIndicator = () => {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center shrink-0 ring-1 ring-violet-100">
        <Bot size={15} />
      </div>
      <div className="bg-neutral-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
      </div>
    </div>
  );
};

export default ChatTypingIndicator;