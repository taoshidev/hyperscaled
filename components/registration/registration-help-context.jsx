"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

const RegistrationHelpContext = createContext(null);

export function RegistrationHelpProvider({ children }) {
  const [activeHelp, setActiveHelp] = useState(null);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const blurTimeoutRef = useRef(null);

  const handleHelpFocus = useCallback((id) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setActiveHelp(id);
  }, []);

  const handleHelpBlur = useCallback(() => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      setActiveHelp(null);
      blurTimeoutRef.current = null;
    }, 50);
  }, []);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  return (
    <RegistrationHelpContext.Provider
      value={{
        activeHelp,
        handleHelpFocus,
        handleHelpBlur,
        isSheetOpen,
        setSheetOpen,
      }}
    >
      {children}
    </RegistrationHelpContext.Provider>
  );
}

export function useRegistrationHelp() {
  const ctx = useContext(RegistrationHelpContext);
  if (!ctx) {
    throw new Error("useRegistrationHelp must be used within RegistrationHelpProvider");
  }
  return ctx;
}
