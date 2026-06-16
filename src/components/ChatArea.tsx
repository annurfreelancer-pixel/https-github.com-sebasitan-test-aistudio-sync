import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Bot, User, Copy, Check, Trash2, 
  Sparkles, Brain, Terminal, Feather, Compass, CornerDownLeft
} from "lucide-react";
import Markdown from "react-markdown";
import { Message, ChatSession } from "../types";
import { PERSONAS } from "../presets";

// Icon mapping function
const renderPersonaIcon = (personaType: string, className = "", size = 20) => {
  switch (personaType) {
    case "default": return <Sparkles size={size} className={className} />;
    case "socratic": return <Brain size={size} className={className} />;
    case "expert": return <Terminal size={size} className={className} />;
    case "creative": return <Feather size={size} className={className} />;
    case "storyteller": return <Compass size={size} className={className} />;
    default: return <Sparkles size={size} className={className} />;
  }
};

interface ChatAreaProps {
  session: ChatSession | null;
  isGenerating: boolean;
  onSendMessage: (content: string) => void;
  onClearSession: () => void;
}

export default function ChatArea({
  session,
  isGenerating,
  onSendMessage,
  onClearSession,
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll messages list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages, isGenerating]);

  // Auto-height adjustment for textarea input
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  if (!session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8 select-none text-center">
        <Bot size={48} className="text-slate-300 mb-4 animate-bounce" />
        <h3 className="text-sm font-bold text-slate-800">No active conversation</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
          Select an existing conversation from the sidebar or click "New Chat" to begin.
        </p>
      </div>
    );
  }

  const activePersona = PERSONAS[session.persona] || PERSONAS.default;

  const handleSend = () => {
    if (inputValue.trim() && !isGenerating) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50/50 h-full overflow-hidden">
      {/* Sticky Workspace Header */}
      <header id="chat-header" className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            {renderPersonaIcon(session.persona, "text-indigo-600")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                {session.title}
              </span>
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded">
                t={session.temperature}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Active persona: <span className="font-semibold text-indigo-650 capitalize">{activePersona.name}</span>
            </p>
          </div>
        </div>

        {session.messages.length > 0 && (
          <button
            id="clear-chat-actions-btn"
            onClick={() => {
              if (confirm("Are you sure you want to clear all messages in this conversation session?")) {
                onClearSession();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-550 border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all cursor-pointer"
            title="Clear current convo history"
          >
            <Trash2 size={13} />
            <span className="font-semibold">Clear Conversation</span>
          </button>
        )}
      </header>

      {/* Messages Scroll Area */}
      <div id="messages-scroller" className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {session.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="p-4 bg-white rounded-full border border-slate-200 shadow-sm">
              {renderPersonaIcon(session.persona, "text-indigo-500", 28)}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Starting point: {activePersona.name}</p>
              <p className="text-[11px] text-slate-500 max-w-sm mt-1 leading-relaxed">
                {activePersona.systemInstruction.slice(0, 100)}...
              </p>
            </div>
            <div className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 py-1.5 px-3.5 rounded-lg max-w-xs font-mono font-medium">
              Ask any question to initiate.
            </div>
          </div>
        ) : (
          session.messages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                id={`message-bubble-${message.id}`}
                className={`flex gap-4 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border select-none ${
                    isUser
                      ? "bg-slate-200 border-slate-300 text-slate-700"
                      : "bg-indigo-150 border-indigo-200 text-indigo-600 bg-indigo-50"
                  }`}
                >
                  {isUser ? <User size={14} /> : renderPersonaIcon(session.persona, "text-indigo-650", 14)}
                </div>

                {/* Message Body Block */}
                <div className="space-y-1.5 max-w-[calc(100%-3rem)] min-w-[150px]">
                  {/* Sender Header */}
                  <div className={`flex items-center gap-2 text-[10px] text-slate-400 font-semibold ${isUser ? "justify-end" : "justify-start"}`}>
                    <span className={isUser ? "text-slate-500" : "text-indigo-650"}>{isUser ? "You" : activePersona.name}</span>
                    <span>•</span>
                    <span>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Text bubble */}
                  <div
                    className={`p-4 rounded-2xl relative group/bubble ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100 border border-indigo-700/50"
                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    ) : (
                      <div className="markdown-body">
                        <Markdown>{message.content}</Markdown>
                      </div>
                    )}

                    {/* Copy button overlay - visible on hover for desktop */}
                    {!isUser && (
                      <button
                        id={`copy-msg-btn-${message.id}`}
                        onClick={() => copyToClipboard(message.id, message.content)}
                        className="absolute top-2 right-2 p-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-550 hover:text-slate-800 rounded-md transition-all opacity-0 group-hover/bubble:opacity-100 cursor-pointer"
                        title="Copy text to clipboard"
                      >
                        {copiedId === message.id ? (
                          <Check size={12} className="text-green-600" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* AI Typing Loader Indicator */}
        {isGenerating && (
          <div id="ai-typing-indicator" className="flex gap-4 max-w-2xl mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-50 border border-indigo-200 text-indigo-600 select-none">
              {renderPersonaIcon(session.persona, "text-indigo-600 animate-spin", 14)}
            </div>
            <div className="space-y-1.5">
              <div className="text-[10px] text-indigo-600 font-bold">{activePersona.name} is typing</div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}

        <div className="h-2" ref={messagesEndRef} />
      </div>

      {/* Message Input Form panel */}
      <footer id="chat-input-panel" className="p-4 border-t border-slate-200 bg-white shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 border border-slate-200 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 rounded-xl bg-slate-50/50 p-2 transition-all">
            <textarea
              id="chat-textarea-input"
              ref={textareaRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activePersona.placeholder}
              className="flex-1 text-sm outline-none resize-none bg-transparent py-1.5 px-2 text-slate-800 placeholder-slate-405 leading-relaxed"
            />
            
            <button
              id="submit-prompt-btn"
              onClick={handleSend}
              disabled={!inputValue.trim() || isGenerating}
              className={`p-2.5 rounded-lg transition-colors flex items-center justify-center shrink-0 cursor-pointer ${
                inputValue.trim() && !isGenerating
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-350 cursor-not-allowed border border-slate-200"
              }`}
              title="Send message"
            >
              <Send size={15} />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 px-1 select-none font-medium">
            <span className="flex items-center gap-1">
              <CornerDownLeft size={10} />
              <span>Press <b className="text-slate-600 font-bold">Enter</b> to send, <b className="text-slate-600 font-bold">Shift+Enter</b> for newline</span>
            </span>
            <span>Gemini may produce inaccurate information.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
