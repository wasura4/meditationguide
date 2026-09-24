"use client";

import React, { createContext, useContext, useState } from "react";
import { BottomNav } from "./BottomNav";
import { GlobalMiniPlayer } from "./GlobalMiniPlayer";
import { usePathname } from "next/navigation";
import { usePlayer } from "@/contexts/PlayerContext";
import { CheckinProvider } from "@/components/checkins/CheckinProvider";

const FocusContext = createContext<(focused: boolean) => void>(() => {});
export const usePracticeFocus = () => useContext(FocusContext);

export function AppChrome({ children }: { children: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  const pathname = usePathname();
  const { guide } = usePlayer();
  const appRoute = [
    "/dashboard",
    "/meditate",
    "/kamatahan",
    "/guides",
    "/dhamma",
    "/learn",
    "/teachers",
    "/analytics",
    "/logbook",
    "/mypath",
    "/pitaka",
    "/books",
    "/settings",
    "/events",
    "/meditation-questions",
  ].some((route) => pathname === route || pathname.startsWith(`${route}/`));
  return (
    <FocusContext.Provider value={setFocused}>
      <CheckinProvider enabled={appRoute}>
        <div
          className={
            appRoute
              ? `app-chrome ${guide ? "app-has-player" : ""} ${focused && pathname === "/meditate" ? "practice-focused" : ""}`
              : undefined
          }
        >
          <div
            className={
              appRoute && !(focused && pathname === "/meditate")
                ? "app-content"
                : undefined
            }
          >
            {children}
          </div>
          {!(focused && pathname === "/meditate") && <GlobalMiniPlayer />}
          {appRoute && !(focused && pathname === "/meditate") && <BottomNav />}
        </div>
      </CheckinProvider>
    </FocusContext.Provider>
  );
}
