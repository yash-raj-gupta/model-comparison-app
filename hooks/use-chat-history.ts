"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatSession, ChatMessage } from "@/lib/types";
import { getModelInfo } from "@/lib/api-utils";

const STORAGE_KEY = "model-arena-history";

export function useChatHistory() {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setChatHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
  }, [chatHistory]);

  const saveToHistory = useCallback((modelId: string, userPrompt: string, responseContent: string) => {
    const modelInfo = getModelInfo(modelId);
    const newSession: ChatSession = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: userPrompt.slice(0, 50) + (userPrompt.length > 50 ? "..." : ""),
      model: modelId,
      messages: [
        { role: "user", content: userPrompt },
        { role: "assistant", content: responseContent },
      ],
      createdAt: Date.now(),
    };

    setChatHistory((prev) => [newSession, ...prev]);
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
  }, []);

  const loadChat = useCallback((chat: ChatSession): { prompt: string; model: string } => {
    return {
      prompt: chat.messages[0]?.content || "",
      model: chat.model,
    };
  }, []);

  const updateChat = useCallback((chatId: string, messages: ChatMessage[], model?: string) => {
    setChatHistory((prev) => {
      const index = prev.findIndex((c) => c.id === chatId);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          messages,
          ...(model && { model }),
        };
        return updated;
      }
      return prev;
    });
  }, []);

  const addChat = useCallback((session: ChatSession) => {
    setChatHistory((prev) => [session, ...prev]);
  }, []);

  return {
    chatHistory,
    saveToHistory,
    deleteChat,
    loadChat,
    updateChat,
    addChat,
  };
}
