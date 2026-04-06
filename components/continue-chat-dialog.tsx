"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUpload } from "@/components/file-upload";
import { FileAttachment } from "@/lib/file-utils";
import { ChatMessage } from "@/lib/types";
import { getModelInfo, buildMultimodalContent } from "@/lib/api-utils";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { MessageCircle, Send, Loader2, AlertCircle } from "lucide-react";

interface ContinueChatDialogProps {
  open: boolean;
  onClose: () => void;
  modelId: string | null;
  context: ChatMessage[];
  apiKey: string;
  baseUrl: string;
}

export function ContinueChatDialog({
  open,
  onClose,
  modelId,
  context,
  apiKey,
  baseUrl,
}: ContinueChatDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileAttachment[]>([]);

  const handleSubmit = async () => {
    if (!prompt.trim() || !modelId) return;

    setIsLoading(true);
    setError(null);
    setResponse("");

    try {
      const userContent = buildMultimodalContent(prompt, files);
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: [...context, { role: "user", content: userContent }],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "No response";
      setResponse(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPrompt("");
    setResponse("");
    setError(null);
    setFiles([]);
    onClose();
  };

  const modelInfo = modelId ? getModelInfo(modelId) : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-violet-500" />
            Continue Chat
            {modelInfo && (
              <Badge variant="outline" className="ml-2">
                {modelInfo.name}
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
            {context.map((msg, idx) => (
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
          {response && (
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
                  {response}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center gap-2 text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col">
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            maxFiles={5}
            disabled={isLoading}
          />
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask a follow-up question..."
            className="min-h-[80px] resize-none"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isLoading}
              className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700"
            >
              {isLoading ? (
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
  );
}
