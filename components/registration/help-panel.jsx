"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HELP_CONTENT } from "./help-content";

const fast = { duration: 0.15 };

export function HelpPanel({ helpId }) {
  const key = helpId || "default";
  const entry = HELP_CONTENT[key];
  if (!entry) return null;

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={key}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fast}
        role="note"
        aria-label={entry.title}
        aria-live="polite"
      >
        <h3 className="text-base font-bold text-foreground tracking-tight mb-2.5">
          {entry.title}
        </h3>
        <div>{entry.content}</div>
      </motion.div>
    </AnimatePresence>
  );
}
