import Link from "next/link";

import { AuthControls } from "@/components/layout/auth-controls";
import { Logo } from "@/components/layout/logo";
import { messages } from "@/lib/i18n";

const links = [
  { href: "/explore", label: messages.nav.explore },
  { href: "/score", label: messages.nav.score },
  { href: "/add", label: messages.nav.contribute },
];

interface SiteHeaderProps {
  authEnabled: boolean;
}

export function SiteHeader({ authEnabled }: SiteHeaderProps) {
  return (
    <header className="border-border bg-background/85 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="-ml-2 flex min-h-11 items-center rounded-md px-2"
          aria-label={`${messages.brand.name} home`}
        >
          <Logo />
        </Link>

        <div className="flex items-center gap-1">
          <nav aria-label="Main">
            <ul className="flex items-center gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground hover:bg-surface-sunken flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <AuthControls enabled={authEnabled} />
        </div>
      </div>
    </header>
  );
}
