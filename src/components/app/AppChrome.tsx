"use client";

import React from "react";
import { BottomNav } from "./BottomNav";
import { GlobalMiniPlayer } from "./GlobalMiniPlayer";
import { usePathname } from "next/navigation";
import { usePlayer } from "@/contexts/PlayerContext";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { guide } = usePlayer();
  const appRoute = [
    "/dashboard",
    "/meditate",
    "/kamatahan",
    "/guides",
    "/dhamma",
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
    <div
      className={
        appRoute ? `app-chrome ${guide ? "app-has-player" : ""}` : undefined
      }
    >
      <div className={appRoute ? "app-content" : undefined}>{children}</div>
      <GlobalMiniPlayer />
      {appRoute && <BottomNav />}
    </div>
  );
}
