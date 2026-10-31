"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import LoadingScreen from "../ui/LoadingScreen";
import { LazyOnboarding, LazyPresence, LazyEasterEggs } from "./LazyExtras";
import SmoothScroll from "./SmoothScroll";

const LoadingContext = createContext({ isSiteReady: false });

export const useLoading = () => useContext(LoadingContext);

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSiteReady, setIsSiteReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsSiteReady(true);
    }
  }, [isLoading]);

  return (
    <LoadingContext.Provider value={{ isSiteReady }}>
      <SmoothScroll>
        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
        <div className={isLoading ? "pointer-events-none" : undefined}>
          {children}
        </div>
        {!isLoading && (
          <>
            <LazyOnboarding />
            <LazyPresence />
            <LazyEasterEggs />
          </>
        )}
      </SmoothScroll>
    </LoadingContext.Provider>
  );
}
