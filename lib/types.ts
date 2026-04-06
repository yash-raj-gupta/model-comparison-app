import { FileAttachment } from "./file-utils";

export interface ModelResponse {
  model: string;
  content: string;
  loading: boolean;
  error?: string;
  latency?: number;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  attachments?: FileAttachment[];
}

export interface ChatSession {
  id: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  createdAt: number;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  color: string;
}
