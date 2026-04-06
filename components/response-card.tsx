"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import {
  Loader2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  MessageCircle,
} from "lucide-react";
import { ModelResponse } from "@/lib/types";
import { getModelInfo } from "@/lib/api-utils";

interface ResponseCardProps {
  response: ModelResponse;
  onCopy: (content: string) => void;
  onContinueChat: () => void;
  isCopied: boolean;
  viewMode?: "grid" | "list";
}

export function ResponseCard({
  response,
  onCopy,
  onContinueChat,
  isCopied,
  viewMode = "grid",
}: ResponseCardProps) {
  const modelInfo = getModelInfo(response.model);

  const renderContent = () => {
    if (response.loading) {
      return (
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
      );
    }

    if (response.error) {
      return (
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
      );
    }

    return (
      <ScrollArea className={viewMode === "grid" ? "h-64" : "h-auto"}>
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
    );
  };

  const header = (
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
  );

  const actions = response.content && !response.loading && (
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
            onClick={onContinueChat}
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
            onClick={() => onCopy(response.content)}
            className="gap-2"
          >
            <AnimatePresence mode="wait">
              {isCopied ? (
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
  );

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Card className="border-zinc-200/50 bg-white/90 shadow-lg shadow-zinc-200/20 backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-zinc-800/50 dark:bg-zinc-900/90 dark:shadow-zinc-950/20">
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
            {renderContent()}
            {response.content && !response.loading && (
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onContinueChat}
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Continue Chat
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(response.content)}
                  className="gap-2"
                >
                  {isCopied ? (
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
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
    >
      <Card className="flex flex-col border-zinc-200/50 bg-white/90 shadow-lg shadow-zinc-200/20 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-zinc-800/50 dark:bg-zinc-900/90 dark:shadow-zinc-950/20">
        {header}
        <CardContent className="flex-1">
          {renderContent()}
        </CardContent>
        {actions}
      </Card>
    </motion.div>
  );
}
