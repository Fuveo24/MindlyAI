"use client";

import { useState } from "react";
import Link from "next/link";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#process" },
  { label: "FAQ", href: "#faq" },
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-50 mx-auto max-w-6xl px-4 py-5 sm:px-6">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 flex-shrink-0 rounded-lg bg-gradient-to-br from-accent-violet to-accent-indigo shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
          <span className="text-sm font-semibold tracking-tight">+ Mindly</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted transition-colors hover:text-text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/auth/login"
            className="text-xs font-medium text-text-muted transition-colors hover:text-text-primary"
          >
            Sign in
          </Link>
          <Link href="/auth/signup" className="btn-outline !px-5 !py-2 text-xs">
            Get started
          </Link>
        </div>

        {/* Mobile: sign-in + hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/auth/login"
            className="text-xs font-medium text-text-muted transition-colors hover:text-text-primary"
          >
            Sign in
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-bg-card text-text-muted transition-colors hover:text-text-primary"
          >
            {menuOpen ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path d="M0 1h16M0 6h16M0 11h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="mt-3 rounded-2xl border border-border-subtle bg-bg-card/95 px-4 py-4 backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 border-t border-border-subtle pt-3">
            <Link
              href="/auth/signup"
              className="btn-primary w-full justify-center"
              onClick={() => setMenuOpen(false)}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
