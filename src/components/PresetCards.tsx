import React from "react";
import { BookOpen, Code2, Paintbrush, ArrowRight } from "lucide-react";
import { PROMPT_PRESETS } from "../presets";
import { PersonaType } from "../types";

export const renderCategoryIcon = (iconName: string, className = "", size = 18) => {
  switch (iconName) {
    case "BookOpen": return <BookOpen size={size} className={className} />;
    case "Code2": return <Code2 size={size} className={className} />;
    case "Paintbrush": return <Paintbrush size={size} className={className} />;
    default: return <BookOpen size={size} className={className} />;
  }
};

interface PresetCardsProps {
  onSelectPreset: (text: string, persona: PersonaType) => void;
}

export default function PresetCards({ onSelectPreset }: PresetCardsProps) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Aesthetic Greeting Header */}
      <div className="text-center mb-10 max-w-lg mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
          What would you like to explore today?
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Select an interactive prompt preset below or compose a custom query to brainstorm logic, draft scripts, analyze variables, or craft narratives with Gemini.
        </p>
      </div>

      {/* Preset Categories GRID */}
      <div className="space-y-8">
        {PROMPT_PRESETS.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase flex items-center gap-1.5 px-1 font-mono">
              {renderCategoryIcon(group.icon, "text-indigo-500", 14)}
              <span>{group.category}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.prompts.map((prompt, promptIdx) => (
                <div
                  key={promptIdx}
                  id={`preset-card-${groupIdx}-${promptIdx}`}
                  onClick={() => onSelectPreset(prompt.text, prompt.persona)}
                  className="group flex flex-col justify-between p-5 bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-50/40 rounded-xl transition-all duration-200 cursor-pointer text-left"
                >
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span className="group-hover:text-indigo-600 transition-colors">{prompt.title}</span>
                      <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {prompt.description}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono text-slate-400">Use {prompt.persona} configuration</span>
                    <span className="text-slate-300 group-hover:text-indigo-600 font-bold transition-colors">Start prompt</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
