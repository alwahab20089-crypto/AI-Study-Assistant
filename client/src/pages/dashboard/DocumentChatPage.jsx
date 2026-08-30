import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send, Sparkles, FileText } from "lucide-react";
import { getDocumentByIdRequest } from "../../services/documentService.js";
import { sendChatMessageRequest, getChatHistoryRequest } from "../../services/chatService.js";
import getErrorMessage from "../../utils/getErrorMessage.js";
import ChatBubble from "../../components/ChatBubble.jsx";
import ChatTypingIndicator from "../../components/ChatTypingIndicator.jsx";

const SUGGESTED_PROMPTS = [
  "Explain this chapter in simple words.",
  "What are the main concepts?",
  "Give me an example of this topic.",
];

const DocumentChatPage = () => {
  const { id } = useParams();

  const [document, setDocument] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const [docRes, historyRes] = await Promise.all([
          getDocumentByIdRequest(id),
          getChatHistoryRequest(id),
        ]);
        setDocument(docRes.data.document);
        setMessages(historyRes.data.messages);
      } catch (err) {
        setLoadError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (text) => {
    const question = (text ?? input).trim();
    if (!question || sending) return;

    setInput("");
    setSendError("");
    setSending(true);

    // Optimistically show the user's message immediately
    setMessages((prev) => [...prev, { role: "user", content: question, _id: `temp-${Date.now()}` }]);

    try {
      const res = await sendChatMessageRequest(id, question);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.answer, sources: res.data.sources, _id: `temp-a-${Date.now()}` },
      ]);
    } catch (err) {
      setSendError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-4 bg-neutral-100 rounded w-24 mb-6" />
        <div className="h-96 bg-neutral-100 rounded-2xl" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-sm text-red-500">{loadError}</p>
        <Link to="/documents" className="text-violet-600 text-sm font-medium mt-4 inline-block hover:text-violet-700 transition-colors duration-200">
          Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <div className="shrink-0">
        <Link
          to={`/documents/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-violet-700 mb-4 transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          Back to document
        </Link>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center shrink-0 ring-1 ring-violet-100">
            <FileText size={16} />
          </div>
          <div>
            <h1 className="font-serif font-semibold text-neutral-900">{document.title}</h1>
            <p className="text-xs text-neutral-400">NovaStudy AI</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-100 text-violet-600 flex items-center justify-center mb-4 ring-1 ring-violet-100">
                <Sparkles size={20} />
              </div>
              <p className="text-sm font-medium text-neutral-700">
                Ask anything about this document.
              </p>
              <div className="mt-4 space-y-2 w-full max-w-sm">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="w-full text-left text-sm text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-xl px-4 py-2.5 transition-colors duration-200"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatBubble
                  key={msg._id}
                  role={msg.role}
                  content={msg.content}
                  sources={msg.sources}
                />
              ))}
              {sending && <ChatTypingIndicator />}
              <div ref={scrollRef} />
            </>
          )}
        </div>

        <div className="border-t border-neutral-100 p-4 shrink-0">
          {sendError && (
            <div className="mb-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">
              {sendError}
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={1}
              disabled={sending}
              className="flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-violet-100 transition-all duration-200 disabled:opacity-60 max-h-32"
            />
            <button
              onClick={() => handleSend()}
              disabled={sending || !input.trim()}
              className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center hover:shadow-lg hover:shadow-violet-300/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentChatPage;