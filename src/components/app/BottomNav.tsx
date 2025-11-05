"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Brain, Library, Music, BookOpenText } from "lucide-react";

type Item = { href: string; label: string; icon: React.ReactNode };

const items: Item[] = [
  { href: "/dashboard", label: "Home", icon: <Home size={20} /> },
  { href: "/meditate", label: "Meditate", icon: <Brain size={20} /> },
  { href: "/dhamma", label: "Dhamma", icon: <BookOpenText size={20} /> },
  { href: "/kamatahan", label: "Kamatahan", icon: <Music size={20} /> },
  { href: "/logbook", label: "Logbook", icon: <Library size={20} /> },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on admin and auth routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) return null;

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
      <nav className="grid grid-cols-5">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center justify-center py-2 text-xs ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              {it.icon}
              <span className="mt-0.5">{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}


