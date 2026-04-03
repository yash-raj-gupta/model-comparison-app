"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-white to-zinc-100 transition-colors duration-500 ease-out dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-end">
            <ModeToggle />
          </div>
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-4 flex items-center justify-center gap-3">
              <motion.div
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
        {showMaxModelsAlert && (
          <Alert className="mb-4 border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You can only compare up to {MAX_MODELS} models at a time. Please deselect a model before selecting another.
            </AlertDescription>
          </Alert>
        )}

        {/* Model Selection */}
        <Card className="mb-6 border-zinc-200/50 bg-white/80 shadow-xl shadow-zinc-200/20 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/80 dark:shadow-zinc-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Bot className="h-5 w-5 text-violet-500" />
              Select Models ({selectedModels.length}/{MAX_MODELS} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              <Info className="mr-1 inline h-4 w-4" />
              You can select up to {MAX_MODELS} models to compare simultaneously per API key.
            </p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelToggle(model.id)}
                  className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    selectedModels.includes(model.id)
                      ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-zinc-100/10"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${model.color}`} />
                  <span>{model.name}</span>
                  <span className="text-xs opacity-60">({model.provider})</span>
                  {selectedModels.includes(model.id) && (
                    <CheckCircle2 className="ml-1 h-3.5 w-3.5" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prompt Input */}
        <Card className="mb-6 border-zinc-200/50 bg-white/80 shadow-xl shadow-zinc-200/20 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/80 dark:shadow-zinc-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <MessageSquare className="h-5 w-5 text-violet-500" />
              Your Prompt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here... Compare how different models respond to the same question!"
              className="min-h-[120px] w-full resize-y rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-zinc-500">
                {prompt.length} characters
              </div>
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
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {responses.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Results
              </h2>
              <Badge variant="secondary" className="text-sm">
                {responses.filter((r) => !r.loading).length}/{responses.length} completed
              </Badge>
            </div>

            <Tabs defaultValue="grid" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="grid" className="gap-2">
                  <Zap className="h-4 w-4" />
                  Grid View
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <Brain className="h-4 w-4" />
                  List View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="grid">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {responses.map((response) => {
                    const modelInfo = getModelInfo(response.model);
                    return (
                      <Card
                        key={response.model}
                        className="flex flex-col border-zinc-200/50 bg-white/90 shadow-lg shadow-zinc-200/20 backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-zinc-800/50 dark:bg-zinc-900/90 dark:shadow-zinc-950/20"
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
                              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                              <span className="text-sm text-zinc-500">Generating response...</span>
                            </div>
                          ) : response.error ? (
                            <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                              <AlertCircle className="h-8 w-8 text-red-500" />
                              <span className="text-sm text-red-600">{response.error}</span>
                            </div>
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
                        )}
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="list">
                <div className="space-y-4">
                  {responses.map((response) => {
                    const modelInfo = getModelInfo(response.model);
                    return (
                      <Card
                        key={response.model}
                        className="border-zinc-200/50 bg-white/90 shadow-lg shadow-zinc-200/20 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/90 dark:shadow-zinc-950/20"
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
                              <div className="flex justify-end">
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
                                      Copy Response
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-zinc-500">
          <p>Powered by LiteLLM Proxy • Compare outputs from 100+ LLMs</p>
        </div>
      </div>
    </div>
  );
}
