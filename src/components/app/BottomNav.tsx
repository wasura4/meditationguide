"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Brain, Music, BarChart3 } from "lucide-react";

type Item = { href: string; key: string; icon: React.ReactNode };

const baseItems: Item[] = [
  { href: "/dashboard", key: "home", icon: <Home size={28} strokeWidth={2.5} /> },
  { href: "/meditate", key: "meditate", icon: <Brain size={28} strokeWidth={2.5} /> },
  { href: "/analytics", key: "analytics", icon: <BarChart3 size={28} strokeWidth={2.5} /> },
  { href: "/kamatahan", key: "kamatahan", icon: <Music size={28} strokeWidth={2.5} /> },
];

export function BottomNav() {
  const pathname = usePathname();
  // icons only; no labels

  // Hide on admin and auth routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) return null;

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
      <nav className="grid grid-cols-4">
        {baseItems.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center justify-center py-3 ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              {it.icon}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}


