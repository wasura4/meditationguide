"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Flower2, BarChart3, Headphones } from "lucide-react";

type Item = { href: string; key: string; icon: React.ReactNode; label: string };

const baseItems: Item[] = [
  { href: "/dashboard", key: "home", icon: <Home size={24} strokeWidth={2.5} />, label: "Home" },
  { href: "/meditate", key: "meditate", icon: <Flower2 size={24} strokeWidth={2.5} />, label: "Meditate" },
  { href: "/analytics", key: "analytics", icon: <BarChart3 size={24} strokeWidth={2.5} />, label: "Stats" },
  { href: "/kamatahan", key: "kamatahan", icon: <Headphones size={24} strokeWidth={2.5} />, label: "Kamatahan" },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on admin and auth routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) return null;

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50">
      <div className="safe-area-inset-bottom pb-1">
        <nav className="flex items-center justify-around px-2 h-[80px]">
          {baseItems.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className="flex flex-col items-center justify-center w-full h-full gap-1"
              >
                <div
                  className={`relative flex items-center justify-center w-16 h-8 rounded-full transition-all duration-300 ${active ? "bg-primary/20" : "bg-transparent"
                    }`}
                >
                  <div className={`transition-transform duration-200 ${active ? "text-primary scale-110" : "text-muted-foreground"}`}>
                    {it.icon}
                  </div>
                </div>
                <span
                  className={`text-[11px] font-medium transition-colors duration-200 ${active ? "text-primary" : "text-muted-foreground"
                    }`}
                >
                  {it.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}


