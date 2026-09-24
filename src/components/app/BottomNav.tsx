"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Flower2, BarChart3, Headphones, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const items = [
  { href: "/dashboard", key: "home", icon: Home, routes: ["/dashboard"] },
  { href: "/meditate", key: "meditate", icon: Flower2, routes: ["/meditate"] },
  {
    href: "/kamatahan",
    key: "listen",
    icon: Headphones,
    routes: ["/kamatahan", "/guides"],
  },
  {
    href: "/dhamma",
    key: "dhamma",
    icon: BookOpen,
    routes: ["/dhamma", "/pitaka", "/books", "/learn", "/teachers"],
  },
  {
    href: "/analytics",
    key: "progress",
    icon: BarChart3,
    routes: ["/analytics", "/logbook", "/mypath"],
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  return (
    <nav aria-label={t("interface.navigation")} className="app-tab-bar">
      <div className="mx-auto grid max-w-xl grid-cols-5 px-2">
        {items.map(({ href, key, icon: Icon, routes }) => {
          const active = routes.some(
            (route) => pathname === route || pathname.startsWith(`${route}/`),
          );
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`app-tab ${active ? "app-tab-active" : ""}`}
            >
              <Icon
                size={23}
                strokeWidth={active ? 2.2 : 1.65}
                aria-hidden="true"
              />
              <span className="text-center text-[10px] font-semibold leading-snug sm:text-xs">
                {t(`interface.tabs.${key}`)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
