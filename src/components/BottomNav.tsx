"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, Columns3, User } from "lucide-react";
import { type LucideIcon } from "lucide-react";

/**
 * Mobile bottom navigation (DESIGN_SPEC "Mobile"). Hidden on md+ where the
 * desktop layout carries its own navigation. Quiet: line icons, 1.5 stroke,
 * active tab in blue, everything else muted.
 */
type Tab = { href: string; label: string; icon: LucideIcon };

const TABS: Tab[] = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/resultats", label: "Résultats", icon: ListChecks },
  { href: "/comparer", label: "Comparer", icon: Columns3 },
  { href: "/profil", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface md:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs ${
                  active ? "text-blue" : "text-muted"
                }`}
              >
                <Icon size={20} strokeWidth={1.5} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
