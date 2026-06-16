import { PersonaConfig, PersonaType } from "./types";

export const PERSONAS: Record<PersonaType, PersonaConfig> = {
  default: {
    id: "default",
    name: "General Assistant",
    icon: "Sparkles",
    description: "Helpful, friendly, and balanced. Perfect for daily questions, research, and brainstorming.",
    systemInstruction: "You are a helpful, smart, and friendly AI chatbot assistant. Try to explain complex ideas in clear, simple language with bullet points and summaries when appropriate. Be conversational, concise, and helpful.",
    placeholder: "Ask me anything...",
  },
  socratic: {
    id: "socratic",
    name: "Socratic Guide",
    icon: "Brain",
    description: "Encourages deep reflection by asking guiding questions instead of giving immediate answers.",
    systemInstruction: "You are a Socratic tutor. Your goal is to guide the user to find the answer themselves. Never give immediate direct answers. Instead, offer conceptual explanations, ask deep-thought-provoking questions, highlight details they missed, and encourage logical reasoning.",
    placeholder: "What concepts are you struggling with?",
  },
  expert: {
    id: "expert",
    name: "Code Specialist",
    icon: "Terminal",
    description: "Deep technical expertise. Writes pristine, secure code and optimizes database designs.",
    systemInstruction: "You are a senior elite software engineer and code optimizer. Write production-ready, clean, secure, and idiomatic code with thorough reasoning, comments, and structure. Explain edge-cases, optimization strategies, and algorithmic complexities clearly.",
    placeholder: "Paste code, schema, or describe the algorithm you need...",
  },
  creative: {
    id: "creative",
    name: "Creative Catalyst",
    icon: "Feather",
    description: "Imaginative and poetic. Writes narratives, copy, poems, and brain-storming ideas.",
    systemInstruction: "You are a world-class creative writer and copywriter. Utilize strong sensory details, rich vocabulary, and artistic metaphors. Deliver original, engaging poetry, narratives, brainstorming ideas, or marketing punchlines.",
    placeholder: "Give me a prompt, topic, or narrative constraint...",
  },
  storyteller: {
    id: "storyteller",
    name: "Storyteller",
    icon: "Compass",
    description: "Immersive tales, customized narratives, or kid-friendly fables.",
    systemInstruction: "You are an engaging voice-over artist and storyteller. Craft immersive, enchanting, and inspiring stories with lovable characters and lessons. Adapt to the requested length and keep the reader hooked.",
    placeholder: "Tell me a story about...",
  },
};

export interface PromptPreset {
  category: string;
  icon: string;
  prompts: {
    title: string;
    description: string;
    text: string;
    persona: PersonaType;
  }[];
}

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    category: "Learn & Research",
    icon: "BookOpen",
    prompts: [
      {
        title: "Explain quantum physics",
        description: "Simple analogy for beginners",
        text: "Explain quantum physics in simple, accessible terms using common everyday analogies. What does entanglement actually mean?",
        persona: "socratic",
      },
      {
        title: "Explain the internet",
        description: "How packages route across continents",
        text: "Explain how DNS, routers, and undersea fiber optic cables work together to load a webpage across the globe under 200 ms.",
        persona: "default",
      },
    ],
  },
  {
    category: "Coding & Engineering",
    icon: "Code2",
    prompts: [
      {
        title: "Optimized Fibonacci",
        description: "Compare DP vs Recursion in TS",
        text: "Write and optimize a TypeScript function to find the nth Fibonacci number. Compare standard recursion, memoization, and iterative bottom-up DP.",
        persona: "expert",
      },
      {
        title: "React custom hook",
        description: "Implement useDebounce",
        text: "Implement a generic React `useDebounce` hook in TypeScript. Show how to use it safely inside a search input with full cleanup and usage examples.",
        persona: "expert",
      },
    ],
  },
  {
    category: "Creative Drafts",
    icon: "Paintbrush",
    prompts: [
      {
        title: "Sci-Fi mini story",
        description: "A clock that ticks backwards",
        text: "Write a high-concept sci-fi story in 200 words about a wrist-watch that suddenly begins ticking backwards by 1 minute every time its wearer is about to make a bad decision.",
        persona: "creative",
      },
      {
        title: "Engaging video hook",
        description: "Attention grabbing copy",
        text: "Generate three distinct viral hooks for a short video explaining high-risk/high-reward psychological biases.",
        persona: "creative",
      },
    ],
  },
];
