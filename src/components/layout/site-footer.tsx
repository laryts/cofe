import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { messages } from "@/lib/i18n";

const REPO_URL = "https://github.com/laryts/cofe";

export function SiteFooter() {
  return (
    <footer className="border-border bg-surface-sunken mt-16 border-t">
      <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-1">
          <Logo className="text-base" />
          <p>{messages.footer.builtWith}</p>
        </div>

        <div className="flex flex-col gap-1 sm:items-end">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link href={REPO_URL} className="hover:text-foreground underline underline-offset-4">
              {messages.nav.github}
            </Link>
            <span>{messages.footer.codeLicense}</span>
            <span>{messages.footer.dataLicense}</span>
          </p>
          <p className="text-subtle-foreground text-xs">
            <a
              href="https://www.openstreetmap.org/copyright"
              className="hover:text-foreground underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              {messages.footer.osmAttribution}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
