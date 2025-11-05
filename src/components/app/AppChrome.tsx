"use client";

import React from "react";
import { BottomNav } from "./BottomNav";
import { GlobalMiniPlayer } from "./GlobalMiniPlayer";

export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GlobalMiniPlayer />
      <BottomNav />
    </>
  );
}
