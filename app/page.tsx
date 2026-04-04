"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModeToggle } from "./components/mode-toggle";
import {
  Loader2,
  Send,
  Bot,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Zap,
  Brain,
  Info,
  ArrowRight,
  Trash2,
  MessageCircle,
  ChevronRight,
  Plus,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

interface ModelResponse {
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

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  createdAt: number;
}

const AVAILABLE_MODELS = [
  { id: "glm-latest", name: "GLM Latest", provider: "Zhipu", color: "bg-blue-600" },
  { id: "kimi-latest", name: "Kimi Latest", provider: "Moonshot", color: "bg-purple-600" },
  { id: "open-large", name: "Open Large", provider: "Juspay", color: "bg-indigo-600" },
  { id: "open-fast", name: "Open Fast", provider: "Juspay", color: "bg-indigo-400" },
  // { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", provider: "Anthropic", color: "bg-orange-500" },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "Anthropic", color: "bg-orange-400" },
  { id: "claude-opus-4-5", name: "Claude Opus 4.5", provider: "Anthropic", color: "bg-orange-600" },
  { id: "claude-opus-4-6", name: "Claude Opus 4.6", provider: "Anthropic", color: "bg-orange-700" },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", provider: "Anthropic", color: "bg-orange-300" },
  // { id: "claude-3-5-haiku@20241022", name: "Claude 3.5 Haiku", provider: "Anthropic", color: "bg-orange-350" },
  // { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku (Alias)", provider: "Anthropic", color: "bg-orange-200" },
  // { id: "gemini-3-pro-preview", name: "Gemini 3 Pro Preview", provider: "Google", color: "bg-teal-600" },
  { id: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview", provider: "Google", color: "bg-teal-500" },
  // { id: "gemini-embedding-001", name: "Gemini Embedding 001", provider: "Google", color: "bg-teal-400" },
  { id: "minimaxai/minimax-m2", name: "MiniMax M2", provider: "MiniMax", color: "bg-rose-600" },
  { id: "glm-flash-experimental", name: "GLM Flash Experimental", provider: "Zhipu", color: "bg-blue-400" },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "Anthropic", color: "bg-orange-550" },
  { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", provider: "Google", color: "bg-teal-650" },
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>(["open-large", "claude-sonnet-4-6", "claude-sonnet-4-5"]);
  const [responses, setResponses] = useState<ModelResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_LITELLM_API_KEY || "");
  const [baseUrl, setBaseUrl] = useState(process.env.NEXT_PUBLIC_LITELLM_BASE_URL || "http://localhost:4000");
  const [copiedModel, setCopiedModel] = useState<string | null>(null);
  const [showMaxModelsAlert, setShowMaxModelsAlert] = useState(false);

  // Chat history state
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [selectedHistoryChat, setSelectedHistoryChat] = useState<ChatSession | null>(null);

  // Continue chat modal state
  const [continueChatModel, setContinueChatModel] = useState<string | null>(null);
  const [continueChatContext, setContinueChatContext] = useState<ChatMessage[]>([]);
  const [continueChatPrompt, setContinueChatPrompt] = useState("");
  const [isContinuingChat, setIsContinuingChat] = useState(false);
  const [continueChatResponse, setContinueChatResponse] = useState<string>("");
  const [continueChatError, setContinueChatError] = useState<string | null>(null);

  // Full-screen chat modal state
  const [fullScreenChat, setFullScreenChat] = useState<ChatSession | null>(null);
  const [fullScreenModel, setFullScreenModel] = useState<string>("");
  const [fullScreenPrompt, setFullScreenPrompt] = useState("");
  const [fullScreenMessages, setFullScreenMessages] = useState<ChatMessage[]>([]);
  const [isFullScreenLoading, setIsFullScreenLoading] = useState(false);
  const [fullScreenError, setFullScreenError] = useState<string | null>(null);

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("model-arena-history");
    if (saved) {
      try {
        setChatHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }
  }, []);

  // Save chat history to localStorage
  useEffect(() => {
    localStorage.setItem("model-arena-history", JSON.stringify(chatHistory));
  }, [chatHistory]);

  const MAX_MODELS = 5;

  const handleModelToggle = (modelId: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((m) => m !== modelId);
      }
      if (prev.length >= MAX_MODELS) {
        setShowMaxModelsAlert(true);
        setTimeout(() => setShowMaxModelsAlert(false), 3000);
        return prev;
      }
      return [...prev, modelId];
    });
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || selectedModels.length === 0) return;

    setIsLoading(true);
    const initialResponses: ModelResponse[] = selectedModels.map((model) => ({
      model,
      content: "",
      loading: true,
    }));
    setResponses(initialResponses);

    const startTimes: Record<string, number> = {};

    const promises = selectedModels.map(async (modelId) => {
      startTimes[modelId] = Date.now();
      try {
        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        const latency = Date.now() - startTimes[modelId];

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "No response";

        setResponses((prev) =>
          prev.map((r) =>
            r.model === modelId
              ? {
                  ...r,
                  content,
                  loading: false,
                  latency,
                  tokens: data.usage,
                }
              : r
          )
        );
      } catch (error) {
        const latency = Date.now() - startTimes[modelId];
        setResponses((prev) =>
          prev.map((r) =>
            r.model === modelId
              ? {
                  ...r,
                  error: error instanceof Error ? error.message : "Unknown error",
                  loading: false,
                  latency,
                }
              : r
          )
        );
      }
    });

    await Promise.all(promises);
    setIsLoading(false);
  };

  const copyToClipboard = async (content: string, model: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedModel(model);
    setTimeout(() => setCopiedModel(null), 2000);
  };

  const getModelInfo = (modelId: string) =>
    AVAILABLE_MODELS.find((m) => m.id === modelId) || {
      name: modelId,
      provider: "Unknown",
      color: "bg-gray-500",
    };

  // Save chat to history after a successful response
  const saveToHistory = (modelId: string, userPrompt: string, responseContent: string) => {
    const modelInfo = getModelInfo(modelId);
    const newSession: ChatSession = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: userPrompt.slice(0, 50) + (userPrompt.length > 50 ? "..." : ""),
      model: modelId,
      messages: [
        { role: "user", content: userPrompt },
        { role: "assistant", content: responseContent },
      ],
      createdAt: Date.now(),
    };

    setChatHistory((prev) => [newSession, ...prev]);
  };

  // Open continue chat modal
  const openContinueChat = (modelId: string, userPrompt: string, responseContent: string) => {
    const modelInfo = getModelInfo(modelId);
    setContinueChatModel(modelId);
    setContinueChatContext([
      { role: "user", content: userPrompt },
      { role: "assistant", content: responseContent },
    ]);
    setContinueChatPrompt("");
    setContinueChatResponse("");
    setContinueChatError(null);
  };

  // Handle continue chat submit
  const handleContinueChat = async () => {
    if (!continueChatPrompt.trim() || !continueChatModel) return;

    setIsContinuingChat(true);
    setContinueChatError(null);
    setContinueChatResponse("");

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: continueChatModel,
          messages: [...continueChatContext, { role: "user", content: continueChatPrompt }],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "No response";

      setContinueChatResponse(content);

      // Update chat history with new message
      const updatedContext = [...continueChatContext, { role: "user" as const, content: continueChatPrompt }, { role: "assistant" as const, content }];
      const modelInfo = getModelInfo(continueChatModel);

      // Create a new session or update existing one
      const existingSessionIndex = chatHistory.findIndex(
        (s) => s.model === continueChatModel && s.messages.length === continueChatContext.length / 2
      );

      if (existingSessionIndex >= 0) {
        // Update existing session
        setChatHistory((prev) => {
          const updated = [...prev];
          updated[existingSessionIndex] = {
            ...updated[existingSessionIndex],
            messages: updated[existingSessionIndex].messages.concat([
              { role: "user", content: continueChatPrompt },
              { role: "assistant", content },
            ]),
          };
          return updated;
        });
      } else {
        // Create new session
        const newSession: ChatSession = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: continueChatPrompt.slice(0, 50) + (continueChatPrompt.length > 50 ? "..." : ""),
          model: continueChatModel,
          messages: updatedContext,
          createdAt: Date.now(),
        };
        setChatHistory((prev) => [newSession, ...prev]);
      }
    } catch (error) {
      setContinueChatError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsContinuingChat(false);
    }
  };

  // Delete a chat from history
  const deleteChat = (chatId: string) => {
    setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
  };

  // Load a chat from history
  const loadChat = (chat: ChatSession) => {
    setSelectedHistoryChat(chat);
    setPrompt(chat.messages[0]?.content || "");
    setSelectedModels([chat.model]);
  };

  // Close continue chat modal
  const closeContinueChat = () => {
    setContinueChatModel(null);
    setContinueChatContext([]);
    setContinueChatPrompt("");
    setContinueChatResponse("");
    setContinueChatError(null);
  };

  // Open full-screen chat
  const openFullScreenChat = (chat: ChatSession) => {
    setFullScreenChat(chat);
    setFullScreenModel(chat.model);
    setFullScreenMessages(chat.messages);
    setFullScreenPrompt("");
    setFullScreenError(null);
  };

  // Close full-screen chat
  const closeFullScreenChat = () => {
    setFullScreenChat(null);
    setFullScreenModel("");
    setFullScreenMessages([]);
    setFullScreenPrompt("");
    setFullScreenError(null);
  };

  // Send message in full-screen chat with optional model switch
  const sendFullScreenMessage = async () => {
    if (!fullScreenPrompt.trim() || !fullScreenModel) return;

    const userMessage = fullScreenPrompt;
    setIsFullScreenLoading(true);
    setFullScreenError(null);

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: fullScreenModel,
          messages: [...fullScreenMessages, { role: "user", content: userMessage }],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content || "No response";

      const updatedMessages: ChatMessage[] = [
        ...fullScreenMessages,
        { role: "user", content: userMessage },
        { role: "assistant", content: assistantMessage },
      ];

      setFullScreenMessages(updatedMessages);
      setFullScreenPrompt("");

      // Update chat in history
      setChatHistory((prev) => {
        const index = prev.findIndex((c) => c.id === fullScreenChat?.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            messages: updatedMessages,
            model: fullScreenModel,
          };
          return updated;
        } else {
          // Create new chat session
          const newSession: ChatSession = {
            id: fullScreenChat?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : ""),
            model: fullScreenModel,
            messages: updatedMessages,
            createdAt: Date.now(),
          };
          return [newSession, ...prev];
        }
      });
    } catch (error) {
      setFullScreenError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsFullScreenLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-white to-zinc-100 transition-colors duration-500 ease-out dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            className="flex items-center justify-end"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <ModeToggle />
          </motion.div>
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-4 flex items-center justify-center gap-3">
              <motion.div
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25"
                animate={{
                  boxShadow: [
                    "0 4px 20px rgba(139, 92, 246, 0.25)",
                    "0 4px 30px rgba(139, 92, 246, 0.4)",
                    "0 4px 20px rgba(139, 92, 246, 0.25)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ scale: 1.05, rotate: 5 }}
              >
                <Sparkles className="h-6 w-6 text-white" />
              </motion.div>
              <h1 className="bg-linear-to-r from-zinc-900 to-zinc-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-zinc-100 dark:to-zinc-400">
                Model Arena
              </h1>
            </div>
            <p className="text-lg text-zinc-600 transition-colors duration-300 dark:text-zinc-400">
              Compare outputs from multiple LLMs simultaneously
            </p>
          </motion.div>
        </div>

        {/* Max Models Alert */}
        <AnimatePresence>
          {showMaxModelsAlert && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Alert className="mb-4 border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You can only compare up to {MAX_MODELS} models at a time. Please deselect a model before selecting another.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Model Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="mb-6 border-zinc-200/50 bg-white/80 shadow-xl shadow-zinc-200/20 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/80 dark:shadow-zinc-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Bot className="h-5 w-5 text-violet-500" />
                Select Models ({selectedModels.length}/{MAX_MODELS} selected)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.p
                className="mb-4 text-sm text-zinc-500 dark:text-zinc-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Info className="mr-1 inline h-4 w-4" />
                You can select up to {MAX_MODELS} models to compare simultaneously per API key.
              </motion.p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_MODELS.map((model, index) => (
                  <motion.button
                    key={model.id}
                    onClick={() => handleModelToggle(model.id)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02, duration: 0.2 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      selectedModels.includes(model.id)
                        ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-zinc-100/10"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <motion.span
                      className={`h-2 w-2 rounded-full ${model.color}`}
                      animate={selectedModels.includes(model.id) ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    />
                    <span>{model.name}</span>
                    <span className="text-xs opacity-60">({model.provider})</span>
                    <AnimatePresence>
                      {selectedModels.includes(model.id) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <CheckCircle2 className="ml-1 h-3.5 w-3.5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Prompt Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="mb-6 border-zinc-200/50 bg-white/80 shadow-xl shadow-zinc-200/20 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/80 dark:shadow-zinc-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <MessageSquare className="h-5 w-5 text-violet-500" />
                Your Prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here... Compare how different models respond to the same question!"
                className="min-h-[120px] w-full resize-y rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                whileFocus={{ borderColor: "#8b5cf6", boxShadow: "0 0 0 3px rgba(139, 92, 246, 0.1)" }}
              />
              <div className="mt-4 flex items-center justify-between">
                <motion.div
                  className="text-sm text-zinc-500"
                  animate={{ opacity: prompt.length > 0 ? 1 : 0.5 }}
                >
                  {prompt.length} characters
                </motion.div>
                <motion.div whileHover={{ scale: prompt.trim() && selectedModels.length > 0 && !isLoading ? 1.02 : 1 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleSubmit}
                    disabled={!prompt.trim() || selectedModels.length === 0 || isLoading}
                    className="gap-2 bg-linear-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Compare Models
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {responses.length > 0 && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  Results
                </h2>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Badge variant="secondary" className="text-sm">
                    {responses.filter((r) => !r.loading).length}/{responses.length} completed
                  </Badge>
                </motion.div>
              </motion.div>

            <Tabs defaultValue="grid" className="w-full">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
              <TabsList className="mb-4">
                <TabsTrigger value="grid" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Grid View
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <Brain className="h-4 w-4" />
                  List View
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  History
                </TabsTrigger>
              </TabsList>
              </motion.div>

              <TabsContent value="grid">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {responses.map((response, index) => {
                    const modelInfo = getModelInfo(response.model);
                    return (
                      <motion.div
                        key={response.model}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                      >
                        <Card
                          className="flex flex-col border-zinc-200/50 bg-white/90 shadow-lg shadow-zinc-200/20 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-zinc-800/50 dark:bg-zinc-900/90 dark:shadow-zinc-950/20"
                        >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`h-3 w-3 rounded-full ${modelInfo.color}`} />
                              <CardTitle className="text-base font-semibold">
                                {modelInfo.name}
                              </CardTitle>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {modelInfo.provider}
                            </Badge>
                          </div>
                          {response.latency && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                              <Clock className="h-3 w-3" />
                              {response.latency}ms
                              {response.tokens && (
                                <>
                                  <Separator orientation="vertical" className="mx-1 h-3" />
                                  {response.tokens.total} tokens
                                </>
                              )}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="flex-1">
                          {response.loading ? (
                            <div className="flex h-40 flex-col items-center justify-center gap-3">
                              <motion.div
                                animate={{
                                  rotate: 360,
                                  scale: [1, 1.1, 1],
                                }}
                                transition={{
                                  rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                                  scale: { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
                                }}
                              >
                                <Loader2 className="h-8 w-8 text-violet-500" />
                              </motion.div>
                              <motion.div
                                initial={{ opacity: 0.5 }}
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                <span className="text-sm text-zinc-500">Generating response...</span>
                              </motion.div>
                            </div>
                          ) : response.error ? (
                            <motion.div
                              className="flex h-40 flex-col items-center justify-center gap-2 text-center"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                            >
                              <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                              >
                                <AlertCircle className="h-8 w-8 text-red-500" />
                              </motion.div>
                              <span className="text-sm text-red-600">{response.error}</span>
                            </motion.div>
                          ) : (
                            <ScrollArea className="h-64">
                              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mb-2 prose-headings:mt-4 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    code({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
                                      const match = /language-(\w+)/.exec(className || '');
                                      return match ? (
                                        <SyntaxHighlighter
                                          style={oneDark}
                                          language={match[1]}
                                          PreTag="div"
                                          {...props}
                                        >
                                          {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                      ) : (
                                        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200" {...props}>
                                          {children}
                                        </code>
                                      );
                                    },
                                    p({ children }) {
                                      return <p className="whitespace-pre-wrap">{children}</p>;
                                    }
                                  }}
                                >
                                  {response.content}
                                </ReactMarkdown>
                              </div>
                            </ScrollArea>
                          )}
                        </CardContent>
                        {response.content && !response.loading && (
                          <div className="px-6 pb-4">
                            <div className="flex gap-2">
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1"
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openContinueChat(response.model, prompt, response.content)}
                                  className="gap-2 w-full"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  Continue Chat
                                </Button>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(response.content, response.model)}
                                  className="gap-2"
                                >
                                  <AnimatePresence mode="wait">
                                    {copiedModel === response.model ? (
                                      <motion.div
                                        key="copied"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="flex items-center gap-2"
                                      >
                                        <Check className="h-4 w-4 text-green-500" />
                                        Copied!
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        key="copy"
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="flex items-center gap-2"
                                      >
                                        <Copy className="h-4 w-4" />
                                        Copy
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                        )}
                      </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="list">
                <div className="space-y-4">
                  {responses.map((response, index) => {
                    const modelInfo = getModelInfo(response.model);
                    return (
                      <motion.div
                        key={response.model}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                      >
                      <Card
                        key={response.model}
                        className="border-zinc-200/50 bg-white/90 shadow-lg shadow-zinc-200/20 backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-zinc-800/50 dark:bg-zinc-900/90 dark:shadow-zinc-950/20"
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`h-4 w-4 rounded-full ${modelInfo.color}`} />
                              <div>
                                <CardTitle className="text-lg font-semibold">
                                  {modelInfo.name}
                                </CardTitle>
                                <p className="text-sm text-zinc-500">{modelInfo.provider}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {response.latency && (
                                <div className="flex items-center gap-1 text-sm text-zinc-500">
                                  <Clock className="h-4 w-4" />
                                  {response.latency}ms
                                </div>
                              )}
                              {response.tokens && (
                                <Badge variant="secondary">
                                  {response.tokens.total} tokens
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {response.loading ? (
                            <div className="flex h-32 items-center justify-center gap-3">
                              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                              <span className="text-zinc-500">Generating response...</span>
                            </div>
                          ) : response.error ? (
                            <div className="flex h-32 items-center justify-center gap-2 text-red-600">
                              <AlertCircle className="h-5 w-5" />
                              {response.error}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mb-2 prose-headings:mt-4 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    code({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
                                      const match = /language-(\w+)/.exec(className || '');
                                      return match ? (
                                        <SyntaxHighlighter
                                          style={oneDark}
                                          language={match[1]}
                                          PreTag="div"
                                          {...props}
                                        >
                                          {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                      ) : (
                                        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm font-mono text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200" {...props}>
                                          {children}
                                        </code>
                                      );
                                    },
                                    p({ children }) {
                                      return <p className="whitespace-pre-wrap">{children}</p>;
                                    }
                                  }}
                                >
                                  {response.content}
                                </ReactMarkdown>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    // Get the original prompt from the first response's context
                                    const firstResponse = responses[0];
                                    if (firstResponse) {
                                      openContinueChat(response.model, prompt, response.content);
                                    }
                                  }}
                                  className="gap-2"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  Continue Chat
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(response.content, response.model)}
                                  className="gap-2"
                                >
                                  {copiedModel === response.model ? (
                                    <>
                                      <Check className="h-4 w-4 text-green-500" />
                                      Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4" />
                                      Copy
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="history">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {chatHistory.length === 0 ? (
                    <Card className="border-zinc-200/50 bg-white/80 dark:border-zinc-800/50 dark:bg-zinc-900/80">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <MessageCircle className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
                        <p className="text-zinc-500 dark:text-zinc-400">No chat history yet</p>
                        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
                          Start a conversation and it will appear here
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {chatHistory.map((chat, index) => {
                        const modelInfo = getModelInfo(chat.model);
                        return (
                          <motion.div
                            key={chat.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card className="border-zinc-200/50 bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-900/80">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => openFullScreenChat(chat)}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`h-2.5 w-2.5 rounded-full ${modelInfo.color}`} />
                                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                        {modelInfo.name}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {chat.messages.length / 2} messages
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                                      {chat.title}
                                    </p>
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                      {new Date(chat.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openFullScreenChat(chat)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteChat(chat.id)}
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </TabsContent>
            </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue Chat Dialog */}
        <Dialog open={!!continueChatModel} onOpenChange={(open) => !open && closeContinueChat()}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-violet-500" />
                Continue Chat
                {continueChatModel && (
                  <Badge variant="outline" className="ml-2">
                    {getModelInfo(continueChatModel).name}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Continue your conversation with the selected model
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {/* Previous messages context */}
              <div className="space-y-3">
                {continueChatContext.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-violet-50 dark:bg-violet-950/30 ml-8"
                        : "bg-zinc-100 dark:bg-zinc-800 mr-8"
                    }`}
                  >
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      {msg.role === "user" ? "You" : "Assistant"}
                    </p>
                    <div className="text-sm whitespace-pre-wrap">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm font-mono text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200" {...props}>
                                {children}
                              </code>
                            );
                          },
                          p({ children }) {
                            return <p className="whitespace-pre-wrap">{children}</p>;
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* New response */}
              {continueChatResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg mr-8"
                >
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Assistant</p>
                  <div className="text-sm whitespace-pre-wrap">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return match ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-sm font-mono text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200" {...props}>
                              {children}
                            </code>
                          );
                        },
                        p({ children }) {
                          return <p className="whitespace-pre-wrap">{children}</p>;
                        }
                      }}
                    >
                      {continueChatResponse}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {continueChatError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{continueChatError}</AlertDescription>
                </Alert>
              )}

              {/* Loading */}
              {isContinuingChat && (
                <div className="flex items-center gap-2 text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col gap-3 sm:flex-col">
              <Textarea
                value={continueChatPrompt}
                onChange={(e) => setContinueChatPrompt(e.target.value)}
                placeholder="Ask a follow-up question..."
                className="min-h-[80px] resize-none"
                disabled={isContinuingChat}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleContinueChat();
                  }
                }}
              />
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={closeContinueChat}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={handleContinueChat}
                  disabled={!continueChatPrompt.trim() || isContinuingChat}
                  className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700"
                >
                  {isContinuingChat ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Full-Screen Chat Dialog */}
        <Dialog open={!!fullScreenChat} onOpenChange={(open) => !open && closeFullScreenChat()}>
          <DialogContent className="max-w-6xl h-[95vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
              <div className="flex items-center justify-between gap-4">
                <DialogTitle className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-violet-500" />
                  Chat Session
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Model:</span>
                  <Select value={fullScreenModel} onValueChange={(value) => setFullScreenModel(value || "")}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${model.color}`} />
                            {model.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {fullScreenMessages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg ${
                    msg.role === "user"
                      ? "bg-violet-50 dark:bg-violet-950/30 ml-16"
                      : "bg-zinc-100 dark:bg-zinc-800 mr-16"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                      {msg.role === "user" ? "You" : getModelInfo(fullScreenModel).name}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }: { className?: string; children?: React.ReactNode }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return match ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-sm font-mono text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200" {...props}>
                              {children}
                            </code>
                          );
                        },
                        p({ children }) {
                          return <p className="whitespace-pre-wrap">{children}</p>;
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              ))}

              {isFullScreenLoading && (
                <div className="flex items-center gap-2 text-zinc-500 p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}

              {fullScreenError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{fullScreenError}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0">
              <div className="flex gap-2 w-full">
                <Textarea
                  value={fullScreenPrompt}
                  onChange={(e) => setFullScreenPrompt(e.target.value)}
                  placeholder="Type your message... (Shift+Enter for new line)"
                  className="min-h-[60px] resize-none flex-1"
                  disabled={isFullScreenLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendFullScreenMessage();
                    }
                  }}
                />
                <Button
                  onClick={sendFullScreenMessage}
                  disabled={!fullScreenPrompt.trim() || isFullScreenLoading}
                  className="h-auto bg-violet-600 hover:bg-violet-700"
                >
                  {isFullScreenLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-zinc-500">
          <p>Powered by LiteLLM Proxy • Compare outputs from 100+ LLMs</p>
        </div>
      </div>
    </div>
  );
}
