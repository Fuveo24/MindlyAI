import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-glow-radial opacity-60"
      />

      <div className="relative z-10 w-full max-w-[360px]">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-accent-violet to-accent-indigo shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
          <span className="text-sm font-semibold">+ Mindly</span>
        </Link>

        <div className="card rounded-2xl p-6 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-5 text-center text-xs text-text-faint">{footer}</p>
      </div>

      <style jsx global>{`
        .auth-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid #1c1c2a;
          color: #ffffff;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .auth-input:focus {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.06);
        }
        .auth-input::placeholder {
          color: #5a5a75;
        }
      `}</style>
    </main>
  );
}
