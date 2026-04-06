"use client";

import { useState } from "react";
import { ModelResponse } from "@/lib/types";
import { MAX_MODELS } from "@/lib/models";
import { buildMultimodalContent } from "@/lib/api-utils";
import { FileAttachment } from "@/lib/file-utils";

interface UseModelComparisonOptions {
  apiKey: string;
  baseUrl: string;
}

export function useModelComparison({ apiKey, baseUrl }: UseModelComparisonOptions) {
  const [responses, setResponses] = useState<ModelResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>(["open-large", "claude-sonnet-4-6", "claude-sonnet-4-5"]);

  const handleModelToggle = (modelId: string, onMaxAlert?: () => void) => {
    setSelectedModels((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((m) => m !== modelId);
      }
      if (prev.length >= MAX_MODELS) {
        onMaxAlert?.();
        return prev;
      }
      return [...prev, modelId];
    });
  };

  const submitPrompt = async (prompt: string, files: FileAttachment[]): Promise<void> => {
    if (!prompt.trim() || selectedModels.length === 0) return;

    setIsLoading(true);
    const initialResponses: ModelResponse[] = selectedModels.map((model) => ({
      model,
      content: "",
      loading: true,
    }));
    setResponses(initialResponses);

    const startTimes: Record<string, number> = {};

    // Build message content with files if present
    const messageContent = buildMultimodalContent(prompt, files);

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

  return {
    responses,
    isLoading,
    selectedModels,
    setSelectedModels,
    handleModelToggle,
    submitPrompt,
  };
}
