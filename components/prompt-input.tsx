"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { FileAttachment } from "@/lib/file-utils";
import { MessageSquare, Send, Loader2 } from "lucide-react";

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  files: FileAttachment[];
  onFilesChange: (files: FileAttachment[]) => void;
  isLoading: boolean;
  onSubmit: () => void;
  selectedModelsCount: number;
}

export function PromptInput({
  prompt,
  onPromptChange,
  files,
  onFilesChange,
  isLoading,
  onSubmit,
  selectedModelsCount,
}: PromptInputProps) {
  const isDisabled = !prompt.trim() || selectedModelsCount === 0 || isLoading;

  return (
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
          <FileUpload
            files={files}
            onFilesChange={onFilesChange}
            maxFiles={5}
            disabled={isLoading}
          />
          <motion.textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
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
            <motion.div whileHover={{ scale: !isDisabled ? 1.02 : 1 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={onSubmit}
                disabled={isDisabled}
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
  );
}
