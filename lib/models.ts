import { Model } from "./types";

export const MAX_MODELS = 5;

export const AVAILABLE_MODELS: Model[] = [
  { id: "glm-latest", name: "GLM Latest", provider: "Zhipu", color: "bg-blue-600" },
  { id: "kimi-latest", name: "Kimi Latest", provider: "Moonshot", color: "bg-purple-600" },
  { id: "open-large", name: "Open Large", provider: "Juspay", color: "bg-indigo-600" },
  { id: "open-fast", name: "Open Fast", provider: "Juspay", color: "bg-indigo-400" },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "Anthropic", color: "bg-orange-400" },
  { id: "claude-opus-4-5", name: "Claude Opus 4.5", provider: "Anthropic", color: "bg-orange-600" },
  { id: "claude-opus-4-6", name: "Claude Opus 4.6", provider: "Anthropic", color: "bg-orange-700" },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", provider: "Anthropic", color: "bg-orange-300" },
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview", provider: "Google", color: "bg-teal-500" },
  { id: "minimaxai/minimax-m2", name: "MiniMax M2", provider: "MiniMax", color: "bg-rose-600" },
  { id: "glm-flash-experimental", name: "GLM Flash Experimental", provider: "Zhipu", color: "bg-blue-400" },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "Anthropic", color: "bg-orange-550" },
  { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", provider: "Google", color: "bg-teal-650" },
];
