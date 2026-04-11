import Link from "next/link";

const mockNodes = [
  { label: "Launch Campaign", sub: "Project root", pos: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2", kind: "root" },
  { label: "Budget · $24k", sub: "USD · Q2", pos: "left-[4%] top-[12%]", kind: "budget" },
  { label: "Berlin Kick-off", sub: "Apr 18 · HQ", pos: "right-[4%] top-[10%]", kind: "event" },
  { label: "Hire designers", sub: "Due May 1", pos: "left-[8%] bottom-[10%]", kind: "task" },
  { label: "Target audience", sub: "AI expanded", pos: "right-[6%] bottom-[10%]", kind: "idea" },
];

const kindAccent: Record<string, string> = {
  root: "from-accent-violet to-accent-indigo",
  idea: "from-violet-400 to-purple-500",
  task: "from-emerald-400 to-teal-500",
  budget: "from-amber-400 to-orange-500",
  event: "from-pink-400 to-fuchsia-500",
};

export default function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-14 text-center sm:px-6 sm:pb-28 sm:pt-20">
      {/* Badge */}
      <div className="eyebrow mb-6 justify-center animate-fade-in-up sm:mb-8">
        AI-powered mind mapping
      </div>

      {/* Headline */}
      <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight animate-fade-in-up [animation-delay:80ms] opacity-0 sm:text-5xl md:text-6xl lg:text-7xl">
        Lay Out Your Ideas
        <br />
        <span className="bg-gradient-to-r from-accent-glow via-accent-violet to-accent-indigo bg-clip-text text-transparent">
          With AI Beside You
        </span>
      </h1>

      {/* Sub */}
      <p className="mx-auto mt-6 max-w-lg px-2 text-sm leading-relaxed text-text-muted animate-fade-in-up [animation-delay:160ms] opacity-0 sm:mt-8 sm:text-base">
        Drop ideas, tasks, budgets, places, and events onto an infinite canvas.
        Let Claude read your nodes and expand your thinking — one click at a time.
      </p>

      {/* CTAs */}
      <div className="mt-8 flex flex-col items-center gap-3 animate-fade-in-up [animation-delay:240ms] opacity-0 sm:mt-12 sm:flex-row sm:justify-center sm:gap-4">
        <Link href="/auth/signup" className="btn-primary w-full max-w-[240px] justify-center sm:w-auto">
          Start for free
        </Link>
        <a href="#features" className="btn-outline w-full max-w-[240px] justify-center sm:w-auto">
          See how it works
        </a>
      </div>

      {/* Stats */}
      <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-6 animate-fade-in-up [animation-delay:300ms] opacity-0 sm:mt-14 sm:gap-10">
        {[
          { value: "6", label: "Node types" },
          { value: "∞", label: "Canvas space" },
          { value: "Claude", label: "AI engine" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-xl font-bold text-accent-glow sm:text-2xl">{s.value}</div>
            <div className="mt-1 text-[11px] text-text-faint">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Canvas preview */}
      <div className="relative mx-auto mt-14 max-w-4xl animate-fade-in-up [animation-delay:320ms] opacity-0 sm:mt-20">
        <div className="card glow-ring relative overflow-hidden p-1">
          {/* Toolbar mockup */}
          <div className="flex items-center gap-1.5 overflow-x-auto rounded-t-xl border-b border-border-subtle bg-bg-elevated px-3 py-3 sm:px-4">
            <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500/60" />
            <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-yellow-500/60" />
            <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-500/60" />
            <div className="mx-2 h-4 w-px flex-shrink-0 bg-border-subtle" />
            {["Idea", "Task", "Budget", "Place", "Event"].map((t) => (
              <div
                key={t}
                className="flex-shrink-0 rounded-full border border-border-subtle bg-bg-card px-2 py-1 text-[10px] text-text-faint"
              >
                {t}
              </div>
            ))}
          </div>

          {/* Canvas */}
          <div className="relative h-56 overflow-hidden rounded-b-xl bg-[#07070c] sm:h-72">
            <div
              aria-hidden
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: "radial-gradient(circle, #2a2a3d 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />

            <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
              <line x1="50%" y1="50%" x2="11%" y2="18%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
              <line x1="50%" y1="50%" x2="88%" y2="16%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
              <line x1="50%" y1="50%" x2="14%" y2="82%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
              <line x1="50%" y1="50%" x2="86%" y2="82%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
            </svg>

            {mockNodes.map((n) =>
              n.kind === "root" ? (
                <div key={n.label} className={`absolute ${n.pos} z-10`}>
                  <div className="whitespace-nowrap rounded-2xl bg-gradient-to-br from-accent-violet to-accent-indigo px-4 py-2.5 text-xs font-semibold shadow-[0_0_40px_rgba(139,92,246,0.5)] animate-pulse-glow sm:px-5 sm:py-3 sm:text-sm">
                    {n.label}
                  </div>
                </div>
              ) : (
                <div key={n.label} className={`absolute ${n.pos} z-10`}>
                  <div className="relative min-w-[90px] rounded-xl border border-border-subtle bg-bg-card/90 px-2.5 py-2 backdrop-blur-sm sm:min-w-[110px] sm:px-3">
                    <div className={`absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r ${kindAccent[n.kind]}`} />
                    <div className="text-[10px] font-semibold text-text-primary sm:text-[11px]">{n.label}</div>
                    <div className="mt-0.5 text-[9px] text-text-faint sm:text-[10px]">{n.sub}</div>
                  </div>
                </div>
              ),
            )}

            <div className="absolute bottom-2 right-3 flex items-center gap-1.5 rounded-full border border-accent-violet/30 bg-accent-violet/10 px-2.5 py-1 text-[9px] font-medium text-accent-glow backdrop-blur-sm sm:bottom-3 sm:right-4 sm:px-3 sm:text-[10px]">
              <span>✦</span>
              <span>Claude is ready to expand</span>
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-6 left-1/2 h-24 w-2/3 -translate-x-1/2 rounded-full bg-accent-violet/20 blur-3xl"
        />
      </div>
    </section>
  );
}
