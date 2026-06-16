export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export type PersonaType = "default" | "socratic" | "expert" | "creative" | "storyteller";

export interface PersonaConfig {
  id: PersonaType;
  name: string;
  icon: string;
  description: string;
  systemInstruction: string;
  placeholder: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  persona: PersonaType;
  temperature: number;
  lastActive: number;
}
