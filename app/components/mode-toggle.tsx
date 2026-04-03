"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme-provider";

export function ModeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const getIcon = () => {
    if (theme === "system") {
      return <Monitor className="h-5 w-5" />;
    }
    return resolvedTheme === "light" ? (
      <Sun className="h-5 w-5" />
    ) : (
      <Moon className="h-5 w-5" />
    );
  };

  const getLabel = () => {
    if (theme === "system") return "System";
    return resolvedTheme === "light" ? "Light" : "Dark";
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className="group relative flex h-10 items-center gap-2 overflow-hidden rounded-xl bg-zinc-100 px-3 text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label={`Toggle theme (current: ${getLabel()})`}
      title={`Theme: ${getLabel()} (click to cycle)`}
    >
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background:
            resolvedTheme === "light"
              ? "radial-gradient(circle at center, rgba(251, 191, 36, 0.15) 0%, transparent 70%)"
              : "radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
        }}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme === "system" ? "system" : resolvedTheme}
          initial={{ y: -15, opacity: 0, rotate: -45, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
          exit={{ y: 15, opacity: 0, rotate: 45, scale: 0.5 }}
          transition={{
            duration: 0.25,
            ease: [0.23, 1, 0.32, 1],
          }}
          className="relative flex items-center justify-center"
        >
          {getIcon()}
        </motion.div>
      </AnimatePresence>

      <motion.span
        className="text-sm font-medium"
        initial={false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {getLabel()}
      </motion.span>

      {/* Cycle indicator dots */}
      <div className="ml-1 flex gap-0.5">
        {["light", "dark", "system"].map((t) => (
          <motion.div
            key={t}
            className="h-1 w-1 rounded-full"
            animate={{
              backgroundColor:
                theme === t
                  ? resolvedTheme === "light"
                    ? "#f59e0b"
                    : "#8b5cf6"
                  : "#9ca3af",
              scale: theme === t ? 1.2 : 1,
            }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>
    </motion.button>
  );
}
