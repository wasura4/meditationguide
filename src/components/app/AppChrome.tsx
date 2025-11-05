"use client";

import React from "react";
import { BottomNav } from "./BottomNav";

export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}

