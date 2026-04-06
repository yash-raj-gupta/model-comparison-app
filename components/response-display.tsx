"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ModelResponse } from "@/lib/types";
import { ResponseCard } from "./response-card";

interface ResponseDisplayProps {
  responses: ModelResponse[];
  onCopy: (content: string, model: string) => void;
  onContinueChat: (modelId: string, prompt: string, content: string) => void;
  copiedModel: string | null;
  prompt: string;
}

export function ResponseDisplay({
  responses,
  onCopy,
  onContinueChat,
  copiedModel,
  prompt,
}: ResponseDisplayProps) {
  return (
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {responses.map((response, index) => (
          <motion.div
            key={response.model}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <ResponseCard
              response={response}
              onCopy={(content) => onCopy(content, response.model)}
              onContinueChat={() => onContinueChat(response.model, prompt, response.content)}
              isCopied={copiedModel === response.model}
              viewMode="grid"
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function ResponseList({
  responses,
  onCopy,
  onContinueChat,
  copiedModel,
  prompt,
}: ResponseDisplayProps) {
  return (
    <div className="space-y-4">
      {responses.map((response, index) => (
        <ResponseCard
          key={response.model}
          response={response}
          onCopy={(content) => onCopy(content, response.model)}
          onContinueChat={() => onContinueChat(response.model, prompt, response.content)}
          isCopied={copiedModel === response.model}
          viewMode="list"
        />
      ))}
    </div>
  );
}
