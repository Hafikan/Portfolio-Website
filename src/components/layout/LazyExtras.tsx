"use client";

import dynamic from "next/dynamic";

// Heavy, non-critical widgets: split into their own chunks and skip SSR so
// they never block the first paint / LCP.
export const LazyBackground = dynamic(() => import("../ui/DynamicBackground"), { ssr: false });
export const LazyTerminal = dynamic(() => import("../ui/TerminalWindow"), { ssr: false });
export const LazyOnboarding = dynamic(() => import("../ui/OnboardingTour"), { ssr: false });
export const LazyPresence = dynamic(() => import("../ui/PresenceCursors"), { ssr: false });
export const LazyEasterEggs = dynamic(() => import("../ui/EasterEggTips"), { ssr: false });
