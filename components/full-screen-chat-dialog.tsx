"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUpload } from "@/components/file-upload";
import { FileAttachment } from "@/lib/file-utils";
import { ChatSession, ChatMessage } from "@/lib/types";
import { AVAILABLE_MODELS } from "@/lib/models";
import { getModelInfo, buildMultimodalContent } from "@/lib/api-utils";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { MessageCircle, Send, Loader2, AlertCircle } from "lucide-react";

interface FullScreenChatDialogProps {
  open: boolean;
  onClose: () => void;
  chat: ChatSession | null;
  onUpdateChat: (chatId: string, messages: ChatMessage[], model?: string) => void;
  onAddChat: (session: ChatSession) => void;
  apiKey: string;
  baseUrl: string;
}

export function FullScreenChatDialog({
  open,
  onClose,
  chat,
  onUpdateChat,
  onAddChat,
  apiKey,
  baseUrl,
}: FullScreenChatDialogProps) {
  const [model, setModel] = useState(chat?.model || "");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileAttachment[]>([]);

  // Sync state when chat prop changes
  useEffect(() => {
    if (chat) {
      setModel(chat.model);
      setMessages(chat.messages);
    } else {
      setModel("");
      setMessages([]);
    }
    setPrompt("");
    setError(null);
    setFiles([]);
  }, [chat]);

  const handleSend = async () => {
    if (!prompt.trim() || !model) return;

    const userContent = buildMultimodalContent(prompt, files);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [...messages, { role: "user", content: userContent }],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const assistantMessage = data.choices?.[0]?.message?.content || "No response";

      const updatedMessages: ChatMessage[] = [
        ...messages,
        { role: "user", content: prompt },
        { role: "assistant", content: assistantMessage },
      ];

      setMessages(updatedMessages);
      setPrompt("");
      setFiles([]);

      // Update chat in history
      if (chat) {
        onUpdateChat(chat.id, updatedMessages, model);
      } else {
        const newSession: ChatSession = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
          model,
          messages: updatedMessages,
          createdAt: Date.now(),
        };
        onAddChat(newSession);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setModel("");
    setPrompt("");
    setMessages([]);
    setError(null);
    setFiles([]);
    onClose();
  };

  const modelInfo = getModelInfo(model);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-6xl h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-violet-500" />
              Chat Session
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Model:</span>
              <Select value={model} onValueChange={(value) => setModel(value || "")}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${m.color}`} />
                        {m.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
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
                  {msg.role === "user" ? "You" : modelInfo.name}
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

          {isLoading && (
            <div className="flex items-center gap-2 text-zinc-500 p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <FileUpload
            files={files}
            onFilesChange={setFiles}
            maxFiles={5}
            disabled={isLoading}
          />
          <div className="flex gap-2 w-full">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="min-h-[60px] resize-none flex-1"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!prompt.trim() || isLoading}
              className="h-auto bg-violet-600 hover:bg-violet-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
