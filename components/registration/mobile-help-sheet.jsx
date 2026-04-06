"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { Question, X } from "@phosphor-icons/react";
import { useRegistrationHelp } from "./registration-help-context";
import { SidebarContent } from "./sidebar-content";

const spring = { type: "spring", stiffness: 120, damping: 22 };

export function MobileHelpSheet() {
  const { isSheetOpen, setSheetOpen, activeHelp } = useRegistrationHelp();
  const dragControls = useDragControls();

  // Body scroll lock when sheet is open
  useEffect(() => {
    if (!isSheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isSheetOpen]);

  return (
    <>
      {/* FAB — mobile only */}
      <button
        type="button"
        onClick={() => setSheetOpen(!isSheetOpen)}
        aria-label={isSheetOpen ? "Close help" : "Open help"}
        aria-expanded={isSheetOpen}
        className="
          fixed bottom-6 right-6 lg:hidden z-40
          w-14 h-14 rounded-full
          bg-teal-400 text-zinc-950
          flex items-center justify-center
          shadow-[0_4px_20px_rgba(0,198,167,0.3)]
          cursor-pointer outline-none
          focus-visible:ring-2 focus-visible:ring-teal-400
          focus-visible:ring-offset-2 focus-visible:ring-offset-background
        "
      >
        {isSheetOpen ? (
          <X size={24} weight="bold" />
        ) : (
          <Question size={24} weight="bold" />
        )}
        {/* Notification dot */}
        {!isSheetOpen && activeHelp && (
          <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-white pulse-teal" />
        )}
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isSheetOpen && (
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sheet panel */}
      <AnimatePresence>
        {isSheetOpen && (
          <motion.div
            key="sheet-panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={spring}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) {
                setSheetOpen(false);
              }
            }}
            className="
              fixed bottom-0 left-0 right-0 z-50 lg:hidden
              max-h-[85dvh] rounded-t-2xl
              bg-[oklch(0.10_0_0)] border-t border-border
              overflow-y-auto overscroll-contain
            "
            role="dialog"
            aria-label="Registration help"
            aria-modal="true"
          >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-2 sticky top-0 bg-[oklch(0.10_0_0)] cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div
                className="w-10 h-1 rounded-full bg-white/20"
                aria-hidden="true"
              />
            </div>

            {/* Content */}
            <div className="px-5 pb-8">
              <SidebarContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
