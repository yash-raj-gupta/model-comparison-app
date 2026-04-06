"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Brain, MessageCircle } from "lucide-react";
import { ModelResponse, ChatSession } from "@/lib/types";
import { ResponseCard } from "./response-card";
import { ChatHistoryList } from "./chat-history-list";

interface ResponseContainerProps {
  responses: ModelResponse[];
  chatHistory: ChatSession[];
  onCopy: (content: string, model: string) => void;
  onContinueChat: (modelId: string, prompt: string, content: string) => void;
  onSelectChat: (chat: ChatSession) => void;
  onDeleteChat: (chatId: string) => void;
  onOpenFullScreen: (chat: ChatSession) => void;
  copiedModel: string | null;
  prompt: string;
}

export function ResponseContainer({
  responses,
  chatHistory,
  onCopy,
  onContinueChat,
  onSelectChat,
  onDeleteChat,
  onOpenFullScreen,
  copiedModel,
  prompt,
}: ResponseContainerProps) {
  return (
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
              <span className="text-sm text-zinc-500">
                {responses.filter((r) => !r.loading).length}/{responses.length} completed
              </span>
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
            </TabsContent>

            <TabsContent value="list">
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
            </TabsContent>

            <TabsContent value="history">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ChatHistoryList
                  chats={chatHistory}
                  onSelectChat={onSelectChat}
                  onDeleteChat={onDeleteChat}
                  onOpenFullScreen={onOpenFullScreen}
                />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
