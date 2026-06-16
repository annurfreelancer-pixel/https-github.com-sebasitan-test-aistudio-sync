import React, { useState } from "react";
import { 
  Plus, Trash2, Edit2, Check, X, Sparkles, Brain, Terminal, 
  Feather, Compass, Settings, Search, AlertCircle
} from "lucide-react";
import { ChatSession, PersonaType } from "../types";
import { PERSONAS } from "../presets";

// Dynamically render the correct Lucide icon based on name string
export const renderLucideIcon = (name: string, className = "", size = 18) => {
  switch (name) {
    case "Sparkles": return <Sparkles size={size} className={className} />;
    case "Brain": return <Brain size={size} className={className} />;
    case "Terminal": return <Terminal size={size} className={className} />;
    case "Feather": return <Feather size={size} className={className} />;
    case "Compass": return <Compass size={size} className={className} />;
    default: return <Sparkles size={size} className={className} />;
  }
};

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  hasApiKey: boolean;
  onSelectSession: (id: string) => void;
  onCreateSession: (persona: PersonaType) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onUpdateSessionSettings: (id: string, settings: { persona?: PersonaType; temperature?: number }) => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  hasApiKey,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onUpdateSessionSettings,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [showSettingsId, setShowSettingsId] = useState<string | null>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Filter conversations
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditTitleValue(currentTitle);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const saveTitle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitleValue.trim()) {
      onRenameSession(id, editTitleValue.trim());
    }
    setEditingSessionId(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      if (editTitleValue.trim()) {
        onRenameSession(id, editTitleValue.trim());
      }
      setEditingSessionId(null);
    } else if (e.key === "Escape") {
      setEditingSessionId(null);
    }
  };

  return (
    <aside id="sidebar-panel" className="w-80 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 select-none">
      {/* Brand & Setup Indicator */}
      <div className="p-4 border-b border-slate-200 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full opacity-90"></div>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">Gemini Assistant</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">GEOMETRIC BALANCE THEME</p>
          </div>
        </div>

        {/* API Key Connection Alert */}
        {!hasApiKey && (
          <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-100 rounded-lg text-[11px] text-amber-800 leading-normal">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Missing Server Secrets</p>
              <p className="opacity-90">Configure <span className="font-semibold">GEMINI_API_KEY</span> in the Secrets panel to enable AI responses.</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons: Create Sessions */}
      <div className="p-3 border-b border-slate-200">
        <div className="grid grid-cols-2 gap-2">
          <button
            id="new-chat-btn"
            onClick={() => onCreateSession("default")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>New Chat</span>
          </button>
          
          <button
            id="expert-chat-btn"
            onClick={() => onCreateSession("expert")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <Terminal size={14} />
            <span>Coding Chat</span>
          </button>
        </div>
      </div>

      {/* Session Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-chats-input"
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs py-1.5 pl-8 pr-3 outline-none border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-lg bg-slate-50 transition-all text-slate-700"
          />
        </div>
      </div>

      {/* Conversations Scroll List */}
      <div id="sessions-list" className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            {searchQuery ? "No matching conversations." : "No chats yet. Click New Chat!"}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const pConfig = PERSONAS[session.persona] || PERSONAS.default;

            return (
              <div
                key={session.id}
                id={`session-item-${session.id}`}
                onClick={() => onSelectSession(session.id)}
                className={`group flex flex-col p-2.5 rounded-lg text-xs transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-100 border-l-4 border-indigo-600 shadow-xs"
                    : "hover:bg-slate-50 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-slate-500 shrink-0">
                      {renderLucideIcon(pConfig.icon, isActive ? "text-indigo-600" : "text-slate-500")}
                    </span>
                    
                    {editingSessionId === session.id ? (
                      <input
                        id={`edit-title-input-${session.id}`}
                        type="text"
                        value={editTitleValue}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditTitleValue(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, session.id)}
                        className="w-full p-0.5 outline-none border-b border-indigo-400 bg-transparent text-slate-900 font-semibold"
                        autoFocus
                      />
                    ) : (
                      <span className={`truncate ${isActive ? "font-semibold text-indigo-900" : "font-medium text-slate-700"}`}>
                        {session.title}
                      </span>
                    )}
                  </div>

                  {/* Actions for each session item */}
                  {editingSessionId === session.id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        id={`save-title-btn-${session.id}`}
                        onClick={(e) => saveTitle(session.id, e)}
                        className="p-1 hover:bg-slate-200 text-green-600 rounded"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        id={`cancel-title-btn-${session.id}`}
                        onClick={cancelEditing}
                        className="p-1 hover:bg-slate-200 text-slate-400"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                      <button
                        id={`edit-title-btn-${session.id}`}
                        onClick={(e) => startEditing(session.id, session.title, e)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded cursor-pointer"
                        title="Rename conversation"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        id={`delete-chat-btn-${session.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Are you sure you want to delete this conversation?")) {
                            onDeleteSession(session.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                        title="Delete conversation"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Optional context meta */}
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 pl-6 select-none">
                  <span className="capitalize">{pConfig.name}</span>
                  <span>•</span>
                  <span>{session.messages.length} prompt{session.messages.length === 1 ? "" : "s"}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Global Configuration Panel at bottom */}
      {activeSession && (
        <div id="settings-drawer" className="p-3 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Settings size={13} className="text-slate-500" />
              <span>Prompt Adjustments</span>
            </span>
            <button
              id="set-persona-accordion-toggle"
              onClick={() => {
                setShowSettingsId(showSettingsId === activeSessionId ? null : activeSessionId);
              }}
              className="text-[10px] text-slate-500 hover:text-slate-950 font-medium py-0.5 px-1.5 bg-white rounded border border-slate-200 cursor-pointer"
            >
              {showSettingsId === activeSessionId ? "Hide" : "Settings"}
            </button>
          </div>

          <div className="text-[11px] text-slate-500 pl-5 mb-2 leading-snug">
            Currently utilizing the <span className="font-semibold text-indigo-650 capitalize">{activeSession.persona}</span> persona configuration.
          </div>

          {showSettingsId === activeSessionId && (
            <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-3.5 animate-fadeIn">
              {/* Persona Selector */}
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Select Persona AI</label>
                <select
                  id="select-persona-ai"
                  value={activeSession.persona}
                  onChange={(e) => onUpdateSessionSettings(activeSession.id, { persona: e.target.value as PersonaType })}
                  className="w-full text-xs p-1.5 border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-lg outline-none bg-white text-slate-700 font-medium"
                >
                  {Object.values(PERSONAS).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Temperature Adjuster */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-medium text-slate-600">Creativity (Temp)</label>
                  <span className="text-[11px] font-mono text-indigo-600 font-bold">{activeSession.temperature}</span>
                </div>
                <input
                  id="temperature-slider"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={activeSession.temperature}
                  onChange={(e) => onUpdateSessionSettings(activeSession.id, { temperature: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer text-xs h-1 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 font-mono">
                  <span>Precise / Solid</span>
                  <span>Creative / Flowing</span>
                </div>
              </div>

              {/* Persona description */}
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-[10px] text-slate-500 leading-normal">
                <p className="font-semibold text-slate-700 mb-0.5 capitalize">{activeSession.persona} mode:</p>
                <p className="text-slate-500">{PERSONAS[activeSession.persona]?.description}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Permanent Sidebar Footer */}
      <div id="sidebar-stallioni-footer" className="p-3.5 border-t border-slate-200 bg-slate-50 text-center shrink-0 flex flex-col items-center justify-center gap-1 select-none">
        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-slate-400 tracking-widest uppercase">
          <span>POWERED BY</span>
          <span className="text-indigo-600 font-extrabold tracking-wider">STALLIONI</span>
        </div>
        <p className="text-[9px] text-slate-450 font-semibold font-mono">INTEGRAL PLATFORM © 2026</p>
      </div>
    </aside>
  );
}
