"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatSession } from "@/lib/types";
import { getModelInfo } from "@/lib/api-utils";
import { MessageCircle, ChevronRight, Trash2, Paperclip } from "lucide-react";

interface ChatHistoryListProps {
  chats: ChatSession[];
  onSelectChat: (chat: ChatSession) => void;
  onDeleteChat: (chatId: string) => void;
  onOpenFullScreen: (chat: ChatSession) => void;
}

export function ChatHistoryList({
  chats,
  onSelectChat,
  onDeleteChat,
  onOpenFullScreen,
}: ChatHistoryListProps) {
  if (chats.length === 0) {
    return (
      <Card className="border-zinc-200/50 bg-white/80 dark:border-zinc-800/50 dark:bg-zinc-900/80">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageCircle className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">No chat history yet</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
            Start a conversation and it will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {chats.map((chat, index) => {
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
                    onClick={() => onOpenFullScreen(chat)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`h-2.5 w-2.5 rounded-full ${modelInfo.color}`} />
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {modelInfo.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {chat.messages.length / 2} messages
                      </Badge>
                      {chat.messages.some((m) => m.attachments && m.attachments.length > 0) && (
                        <Badge variant="secondary" className="text-xs">
                          <Paperclip className="h-3 w-3 mr-1" />
                          Files
                        </Badge>
                      )}
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
                      onClick={() => onOpenFullScreen(chat)}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteChat(chat.id)}
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
  );
}
