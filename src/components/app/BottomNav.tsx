"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Brain, Library, Music, BarChart3 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type Item = { href: string; label: string; icon: React.ReactNode };

const baseItems = [
  { href: "/dashboard", key: "home", icon: <Home size={20} /> },
  { href: "/meditate", key: "meditate", icon: <Brain size={20} /> },
  { href: "/analytics", key: "analytics", icon: <BarChart3 size={20} /> },
  { href: "/kamatahan", key: "kamatahan", icon: <Music size={20} /> },
  { href: "/logbook", key: "logbook", icon: <Library size={20} /> },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Hide on admin and auth routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) return null;

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
      <nav className="grid grid-cols-5">
        {baseItems.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center justify-center py-2 text-xs ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              {it.icon}
              <span className="mt-0.5">{t(`navigation.${it.key}`)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}


