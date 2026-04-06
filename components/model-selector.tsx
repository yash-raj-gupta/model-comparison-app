"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, CheckCircle2, Info, AlertCircle } from "lucide-react";
import { AVAILABLE_MODELS, MAX_MODELS } from "@/lib/models";

interface ModelSelectorProps {
  selectedModels: string[];
  onModelToggle: (modelId: string) => void;
  showAlert?: boolean;
  onAlertClose?: () => void;
}

export function ModelSelector({
  selectedModels,
  onModelToggle,
  showAlert = false,
  onAlertClose,
}: ModelSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="mb-6 border-zinc-200/50 bg-white/80 shadow-xl shadow-zinc-200/20 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-900/80 dark:shadow-zinc-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Bot className="h-5 w-5 text-violet-500" />
            Select Models ({selectedModels.length}/{MAX_MODELS} selected)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.p
            className="mb-4 text-sm text-zinc-500 dark:text-zinc-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Info className="mr-1 inline h-4 w-4" />
            You can select up to {MAX_MODELS} models to compare simultaneously per API key.
          </motion.p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_MODELS.map((model, index) => (
              <motion.button
                key={model.id}
                onClick={() => onModelToggle(model.id)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  selectedModels.includes(model.id)
                    ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-zinc-100/10"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                <motion.span
                  className={`h-2 w-2 rounded-full ${model.color}`}
                  animate={selectedModels.includes(model.id) ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                />
                <span>{model.name}</span>
                <span className="text-xs opacity-60">({model.provider})</span>
                <AnimatePresence>
                  {selectedModels.includes(model.id) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <CheckCircle2 className="ml-1 h-3.5 w-3.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            <Alert className="border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You can only compare up to {MAX_MODELS} models at a time. Please deselect a model before selecting another.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
