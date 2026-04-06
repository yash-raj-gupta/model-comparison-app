"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ModeToggle } from "./components/mode-toggle";
import { ModelSelector } from "@/components/model-selector";
import { PromptInput } from "@/components/prompt-input";
import { ResponseContainer } from "@/components/response-container";
import { ContinueChatDialog } from "@/components/continue-chat-dialog";
import { FullScreenChatDialog } from "@/components/full-screen-chat-dialog";
import { useChatHistory } from "@/hooks/use-chat-history";
import { FileAttachment } from "@/lib/file-utils";
import { ChatSession, ModelResponse, ChatMessage } from "@/lib/types";
import { buildMultimodalContent } from "@/lib/api-utils";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>(["open-large", "claude-sonnet-4-6", "claude-sonnet-4-5"]);
  const [responses, setResponses] = useState<ModelResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey] = useState(process.env.NEXT_PUBLIC_LITELLM_API_KEY || "");
  const [baseUrl] = useState(process.env.NEXT_PUBLIC_LITELLM_BASE_URL || "http://localhost:4000");
  const [copiedModel, setCopiedModel] = useState<string | null>(null);
  const [showMaxModelsAlert, setShowMaxModelsAlert] = useState(false);

  // File attachments state
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);

  // Chat history hook
  const { chatHistory, deleteChat, updateChat, addChat, saveToHistory } = useChatHistory();

  // Continue chat modal state
  const [continueChatModel, setContinueChatModel] = useState<string | null>(null);
  const [continueChatContext, setContinueChatContext] = useState<ChatMessage[]>([]);

  // Full-screen chat modal state
  const [fullScreenChat, setFullScreenChat] = useState<ChatSession | null>(null);

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
    const messageContent = buildMultimodalContent(prompt, attachedFiles);
    const successfulResponses: { modelId: string; content: string }[] = [];

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
            messages: [{ role: "user", content: messageContent }],
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

        successfulResponses.push({ modelId, content });

        setResponses((prev) =>
          prev.map((r) =>
            r.model === modelId
              ? { ...r, content, loading: false, latency, tokens: data.usage }
              : r
          )
        );
      } catch (error) {
        const latency = Date.now() - startTimes[modelId];
        setResponses((prev) =>
          prev.map((r) =>
            r.model === modelId
              ? { ...r, error: error instanceof Error ? error.message : "Unknown error", loading: false, latency }
              : r
          )
        );
      }
    });

    await Promise.all(promises);
    setIsLoading(false);

    // Save successful responses to chat history
    successfulResponses.forEach(({ modelId, content }) => {
      saveToHistory(modelId, prompt, content);
    });
  };

  const copyToClipboard = async (content: string, model: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedModel(model);
    setTimeout(() => setCopiedModel(null), 2000);
  };

  const openContinueChat = (modelId: string, userPrompt: string, responseContent: string) => {
    setContinueChatModel(modelId);
    setContinueChatContext([
      { role: "user", content: userPrompt },
      { role: "assistant", content: responseContent },
    ]);
  };

  const openFullScreenChat = (chat: ChatSession) => {
    setFullScreenChat(chat);
  };

  const closeContinueChat = () => {
    setContinueChatModel(null);
    setContinueChatContext([]);
  };

  const closeFullScreenChat = () => {
    setFullScreenChat(null);
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
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: showMaxModelsAlert ? 1 : 0, y: showMaxModelsAlert ? 0 : -10, scale: showMaxModelsAlert ? 1 : 0.95 }}
          transition={{ duration: 0.2 }}
          className="mb-4"
        >
          {showMaxModelsAlert && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-orange-800 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-200">
              <p className="text-sm">
                You can only compare up to {MAX_MODELS} models at a time. Please deselect a model before selecting another.
              </p>
            </div>
          )}
        </motion.div>

        {/* Model Selection */}
        <ModelSelector
          selectedModels={selectedModels}
          onModelToggle={handleModelToggle}
          showAlert={showMaxModelsAlert}
        />

        {/* Prompt Input */}
        <PromptInput
          prompt={prompt}
          onPromptChange={setPrompt}
          files={attachedFiles}
          onFilesChange={setAttachedFiles}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          selectedModelsCount={selectedModels.length}
        />

        {/* Results */}
        <ResponseContainer
          responses={responses}
          chatHistory={chatHistory}
          onCopy={copyToClipboard}
          onContinueChat={openContinueChat}
          onSelectChat={() => {}}
          onDeleteChat={deleteChat}
          onOpenFullScreen={openFullScreenChat}
          copiedModel={copiedModel}
          prompt={prompt}
        />

        {/* Continue Chat Dialog */}
        <ContinueChatDialog
          open={!!continueChatModel}
          onClose={closeContinueChat}
          modelId={continueChatModel}
          context={continueChatContext}
          apiKey={apiKey}
          baseUrl={baseUrl}
        />

        {/* Full-Screen Chat Dialog */}
        <FullScreenChatDialog
          open={!!fullScreenChat}
          onClose={closeFullScreenChat}
          chat={fullScreenChat}
          onUpdateChat={updateChat}
          onAddChat={addChat}
          apiKey={apiKey}
          baseUrl={baseUrl}
        />

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-zinc-500">
          <p>Powered by LiteLLM Proxy • Compare outputs from 100+ LLMs</p>
        </div>
      </div>
    </div>
  );
}
