// src/context/LoaderContext.tsx
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

type LoaderContextType = {
  showLoader: (show: boolean) => void;
};

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export function LoaderProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  const showLoader = (show: boolean) => setVisible(show);

  return (
    <LoaderContext.Provider value={{ showLoader }}>
      {children}
      {visible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <motion.div
            className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
        </div>
      )}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error("useLoader must be used inside LoaderProvider");
  }
  return context.showLoader;
}
