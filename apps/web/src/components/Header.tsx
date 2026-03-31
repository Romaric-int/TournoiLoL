"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

// icône Discord en SVG
function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export default function Header() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* logo */}
        <div>
          <Link href="/" className="flex items-center gap-3">
            <Image src="/images/logo.svg" alt="Logo" width={32} height={25} />
            <span className="text-lg font-bold tracking-wider text-[var(--foreground)]">
              TOURNOI
            </span>
          </Link>
        </div>

        {/* navigation */}
        <nav className="flex items-center gap-6">
          {[
            { href: "/rateme", label: "Mon inscription" },
            { href: "/mercato", label: "Mercato" },
            { href: "/teams", label: "Equipes" },
            { href: "/planning", label: "Planning" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`cursor-pointer text-sm transition-colors hover:text-[var(--accent)] pb-1 border-b-2 ${pathname === href ? "border-[var(--accent)] text-[var(--foreground)]" : "border-transparent text-[var(--foreground)]"}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* bouton connexion */}
        <div>
          {loading ? (
            <div className="h-9 w-32 animate-pulse rounded-lg bg-[var(--border)]" />
          ) : session ? (
            <div className="flex items-center gap-4">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt="avatar"
                  className="h-8 w-8 rounded-full border border-[var(--border)]"
                />
              )}
              <span className="text-sm text-[var(--muted)]">
                {session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] transition-colors hover:border-red-500/50 hover:text-red-400"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("discord")}
              className="glow flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--accent-hover)]"
            >
              <DiscordIcon />
              Connexion Discord
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
