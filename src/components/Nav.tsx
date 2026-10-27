"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Přehled" },
  { href: "/readings", label: "Odečty" },
  { href: "/meters", label: "Měřiče" },
  { href: "/tariffs", label: "Sazby" },
  { href: "/reports", label: "Souhrny" },
  { href: "/account", label: "Účet" },
];

export default function Nav() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/account/password") return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-6 gap-1 border-t border-rule bg-surface px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:block md:space-y-0.5 md:border-0 md:bg-transparent md:p-0">
      {NAV.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${active ? "is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
