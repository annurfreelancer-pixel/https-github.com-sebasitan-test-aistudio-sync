import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import PresetCards from "./components/PresetCards";
import { ChatSession, Message, PersonaType } from "./types";
import { PERSONAS } from "./presets";

const STORAGE_SESSIONS_KEY = "gemini_chatbot_sessions_v1";
const STORAGE_ACTIVE_KEY = "gemini_chatbot_active_id_v1";

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);

  // 1. Check server-side config for GEMINI_API_KEY initially
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasApiKey === "boolean") {
          setHasApiKey(data.hasApiKey);
        }
      })
      .catch((err) => {
        console.error("Failed to check server API config state:", err);
      });
  }, []);

  // 2. Load initially stored sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem(STORAGE_SESSIONS_KEY);
    const savedActiveId = localStorage.getItem(STORAGE_ACTIVE_KEY);

    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions) as ChatSession[];
        setSessions(parsed);
        if (savedActiveId && parsed.some((s) => s.id === savedActiveId)) {
          setActiveSessionId(savedActiveId);
        } else if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Error parsing local sessions history:", e);
        initializeDefaultSession();
      }
    } else {
      initializeDefaultSession();
    }
  }, []);

  // Helper code to initialize standard starter session
  const initializeDefaultSession = () => {
    const starterId = `session-${Date.now()}`;
    const starterSession: ChatSession = {
      id: starterId,
      title: "New Conversation",
      messages: [],
      persona: "default",
      temperature: 0.7,
      lastActive: Date.now(),
    };
    setSessions([starterSession]);
    setActiveSessionId(starterId);
  };

  // 3. Save conversations states to localStorage on modifications
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
    } else {
      localStorage.removeItem(STORAGE_SESSIONS_KEY);
    }
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(STORAGE_ACTIVE_KEY, activeSessionId);
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_KEY);
    }
  }, [activeSessionId]);

  // Handle active session object selection helper
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Action: Create another session thread
  const handleCreateSession = (persona: PersonaType = "default") => {
    const newId = `session-${Date.now()}`;
    const personaConfig = PERSONAS[persona] || PERSONAS.default;
    const newSession: ChatSession = {
      id: newId,
      title: `New ${personaConfig.name}`,
      messages: [],
      persona,
      temperature: 0.7,
      lastActive: Date.now(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
  };

  // Action: Delete conversation key
  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      if (updated.length === 0) {
        // If empty, spawn another blank thread to keep the view elegant
        const replacementId = `session-${Date.now()}`;
        const replacement: ChatSession = {
          id: replacementId,
          title: "New Conversation",
          messages: [],
          persona: "default",
          temperature: 0.7,
          lastActive: Date.now(),
        };
        setTimeout(() => setActiveSessionId(replacementId), 0);
        return [replacement];
      }
      
      if (activeSessionId === id) {
        // Select nearest available active session
        setTimeout(() => setActiveSessionId(updated[0].id), 0);
      }
      return updated;
    });
  };

  // Action: Rename title of a session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  // Action: Modify specific session config settings (persona, temp)
  const handleUpdateSessionSettings = (
    id: string,
    settings: { persona?: PersonaType; temperature?: number }
  ) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...settings } : s))
    );
  };

  // Action: Select preset starting card
  const handleSelectPreset = (text: string, persona: PersonaType) => {
    if (!activeSession) return;
    
    // Configure starting state for current session
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          const personaConfig = PERSONAS[persona] || PERSONAS.default;
          return {
            ...s,
            persona,
            title: text.length > 20 ? text.slice(0, 20) + "..." : text,
          };
        }
        return s;
      })
    );

    // Call immediate submission on set
    setTimeout(() => {
      // Trigger API send
      submitMessageToAI(text, persona);
    }, 50);
  };

  // Action: Clear message list of current thread
  const handleClearSessionMessages = () => {
    if (!activeSessionId) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [] } : s))
    );
  };

  // Core Orchestrator: Submit user query and progressive decode SSE stream
  const handleSendMessage = (content: string) => {
    submitMessageToAI(content);
  };

  const submitMessageToAI = async (content: string, overridePersona?: PersonaType) => {
    if (!activeSessionId || isGenerating) return;

    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (!currentSession) return;

    // Generate accurate user message object
    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };

    // Append user message immediately
    const updatedMessages = [...currentSession.messages, userMsg];
    
    // Auto-rename thread title if it was a default placeholder on first prompt
    let updatedTitle = currentSession.title;
    if (currentSession.messages.length === 0) {
      updatedTitle = content.length > 25 ? content.slice(0, 25) + "..." : content;
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: updatedTitle,
              messages: updatedMessages,
              lastActive: Date.now(),
            }
          : s
      )
    );

    setIsGenerating(true);

    const activePersona = overridePersona || currentSession.persona;
    const personaConfig = PERSONAS[activePersona] || PERSONAS.default;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          temperature: currentSession.temperature,
          systemInstruction: personaConfig.systemInstruction,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Server replied with connection error code.");
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Unable to establish readable body connection from stream.");
      }

      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      // Append assistant progress indicator shell
      const assistantMsgId = `msg-agent-${Date.now()}`;
      const assistantMsgShell: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, assistantMsgShell] }
            : s
        )
      );

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || ""; // buffer remainder

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          if (trimmedLine.startsWith("data: ")) {
            const dataStr = trimmedLine.slice(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }

            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.text) {
                assistantContent += data.text;
                // Live update content
                setSessions((prev) =>
                  prev.map((s) => {
                    if (s.id !== activeSessionId) return s;
                    return {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantMsgId
                          ? { ...m, content: assistantContent }
                          : m
                      ),
                    };
                  })
                );
              }
            } catch (jsonErr) {
              // Ignore split chunk json errors
            }
          }
        }
      }
    } catch (apiError: any) {
      console.error("AI service breakdown:", apiError);
      
      // Append a clear system-error warning block with assistance directions
      const errorMsg: Message = {
        id: `msg-error-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **Service Interruption**\n\n${
          apiError.message || "Failed to establish a streaming pipeline connection with Gemini."
        }\n\n*Please ensure that your server is properly configured with a valid **GEMINI_API_KEY** secret in Settings > Secrets. Try refreshing the app or resubmitting.*`,
        timestamp: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, errorMsg] }
            : s
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div id="app-root-container" className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
      {/* Top Global Geometric Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full opacity-90"></div>
          </div>
          <span className="font-bold text-base text-slate-900 tracking-tight">Gemini Workspace</span>
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded">
            v1.5.0
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-500">
          <a href="#" className="text-indigo-600 border-b-2 border-indigo-600 pb-5 pt-5 mt-[-1px]">Chat Studio</a>
          <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="hover:text-indigo-600 transition-colors">Documentation</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">API Playground</a>
        </nav>

        <div className="flex items-center gap-3">
          {hasApiKey ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
              Secure API Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider">
              Server Pending
            </span>
          )}
        </div>
      </header>

      {/* Main split viewport layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation & Settings Panel */}
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          hasApiKey={hasApiKey}
          onSelectSession={setActiveSessionId}
          onCreateSession={handleCreateSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onUpdateSessionSettings={handleUpdateSessionSettings}
        />

        {/* Main chat viewport */}
        <main id="chat-viewport" className="flex-1 flex flex-col h-full bg-slate-50/20 relative border-r border-slate-200">
          {activeSession ? (
            activeSession.messages.length === 0 ? (
              <div className="flex-1 flex flex-col justify-between overflow-y-auto">
                {/* If no messages, render prompt preset cards */}
                <PresetCards onSelectPreset={handleSelectPreset} />
                
                {/* Bottom dummy input layout to let user type directly as well */}
                <ChatArea
                  session={activeSession}
                  isGenerating={isGenerating}
                  onSendMessage={handleSendMessage}
                  onClearSession={handleClearSessionMessages}
                />
              </div>
            ) : (
              <ChatArea
                session={activeSession}
                isGenerating={isGenerating}
                onSendMessage={handleSendMessage}
                onClearSession={handleClearSessionMessages}
              />
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <h3 className="text-sm font-bold text-slate-700">Select a chat</h3>
              <p className="text-xs mt-1">Please select an existing session or start a new prompt session.</p>
            </div>
          )}
        </main>

        {/* Right Sidebar: Contextual Info & Quick Actions */}
        <aside id="contextual-panel" className="w-72 bg-white p-5 shrink-0 hidden lg:flex flex-col gap-6 overflow-y-auto select-none">
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Model Information</p>
            
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Model Engine</span>
                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                  {activeSession?.persona === "expert" ? "GEMINI-FLASH-CODE" : "GEMINI-3.5-FLASH"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Context Mode</span>
                <span className="text-xs font-bold text-indigo-650">Optimal Balance</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Active Thread</span>
                <span className="text-xs font-mono font-semibold text-slate-700 truncate max-w-[120px]" title={activeSession?.title}>
                  {activeSession ? activeSession.title : "None selected"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Suggested Actions and Modes</p>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleSelectPreset("Please summarize this draft text cleanly, highlight the key bullet points under a bold overview title:\n\n[Paste text content here]", "default")}
                className="w-full text-left p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-indigo-400 hover:bg-slate-100/50 transition-all font-medium flex items-center justify-between group cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-slate-700 font-bold group-hover:text-indigo-600 transition-colors">Summarize Text</span>
                  <span className="text-[10px] text-slate-400 font-normal">Extract outline in default mode</span>
                </div>
                <span className="text-slate-300 group-hover:text-indigo-600 text-xs transition-colors">→</span>
              </button>

              <button
                onClick={() => handleSelectPreset("Find potential memory leaks, type safety errors, or optimization flaws in this code block:\n\n```typescript\n// Paste code here\n```", "expert")}
                className="w-full text-left p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-indigo-400 hover:bg-slate-100/50 transition-all font-medium flex items-center justify-between group cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-slate-700 font-bold group-hover:text-indigo-600 transition-colors">Code Debug</span>
                  <span className="text-[10px] text-slate-400 font-normal">Expert diagnostics and review</span>
                </div>
                <span className="text-slate-300 group-hover:text-indigo-600 text-xs transition-colors">→</span>
              </button>

              <button
                onClick={() => handleSelectPreset("Draft a warm and objective professional email addressing the following core points:\n\n- Topic: \n- Audience: Partners", "creative")}
                className="w-full text-left p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs hover:border-indigo-400 hover:bg-slate-100/50 transition-all font-medium flex items-center justify-between group cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-slate-700 font-bold group-hover:text-indigo-600 transition-colors">Email Draft</span>
                  <span className="text-[10px] text-slate-400 font-normal">Polite persuasive correspondence</span>
                </div>
                <span className="text-slate-300 group-hover:text-indigo-600 text-xs transition-colors">→</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-50/55 p-3.5 border border-slate-100 rounded-xl text-[11px] text-slate-500 leading-relaxed font-medium">
            <p className="font-bold text-slate-700 mb-1">Session Analytics</p>
            <div className="space-y-1 text-slate-400 text-[10px]">
              <p>Total Saved Convos: <b className="text-slate-600 font-mono">{sessions.length}</b></p>
              <p>Total Prompts in Current: <b className="text-slate-600 font-mono">{activeSession?.messages.length || 0}</b></p>
            </div>
          </div>

          <div className="mt-auto border-t border-slate-100 pt-4 text-center space-y-2">
            <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5 font-bold font-mono tracking-wider">
              SYSTEM STATUS:
              <span className="flex items-center gap-1 text-green-500">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                ONLINE
              </span>
            </p>
            <p className="text-[10px] text-slate-400 font-mono font-bold tracking-wider">
              ENGINEERED BY: <span className="text-indigo-600 font-extrabold">STALLIONI</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
