"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Brain, BarChart3, GraduationCap } from "lucide-react";

type Item = { href: string; key: string; icon: React.ReactNode };

const baseItems: Item[] = [
  { href: "/dashboard", key: "home", icon: <Home size={28} strokeWidth={2.5} /> },
  { href: "/meditate", key: "meditate", icon: <Brain size={28} strokeWidth={2.5} /> },
  { href: "/analytics", key: "analytics", icon: <BarChart3 size={28} strokeWidth={2.5} /> },
  { href: "/kamatahan", key: "kamatahan", icon: <GraduationCap size={28} strokeWidth={2.5} /> },
];

export function BottomNav() {
  const pathname = usePathname();
  // icons only; no labels

  // Hide on admin and auth routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) return null;

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t shadow-lg supports-[backdrop-filter]:backdrop-blur-xl">
      <div className="safe-area-inset-bottom">
        <nav className="grid grid-cols-4 gap-1 px-2 py-2">
          {baseItems.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-primary/10 text-primary scale-105"
                    : "text-muted-foreground hover:bg-muted/50 active:scale-95"
                }`}
              >
                <div className={`transition-transform ${active ? "scale-110" : ""}`}>
                  {it.icon}
                </div>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}


