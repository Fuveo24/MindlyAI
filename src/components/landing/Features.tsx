const features = [
  {
    icon: "⬡",
    title: "Infinite Canvas",
    body: "Zoom, pan, and arrange nodes freely on a boundless space that grows with your ideas. No page limits.",
    accent: "from-accent-violet to-accent-indigo",
  },
  {
    icon: "$",
    title: "Budget & Time Aware",
    body: "Each node carries a price, deadline, and location. Your mind map tracks the plan behind the ideas.",
    accent: "from-amber-400 to-orange-500",
  },
  {
    icon: "✦",
    title: "Claude-Powered",
    body: "Ask Claude to expand a node, suggest next steps, or generate a full branch from a short instruction.",
    accent: "from-pink-400 to-fuchsia-500",
  },
  {
    icon: "◎",
    title: "Six Node Types",
    body: "Idea, Task, Budget, Place, Event, and a root Project node. Each type surfaces the right fields.",
    accent: "from-sky-400 to-cyan-500",
  },
  {
    icon: "⇄",
    title: "Live Edges",
    body: "Drag to connect any two nodes. Animated edges respond to zoom so your structure stays clear.",
    accent: "from-emerald-400 to-teal-500",
  },
  {
    icon: "☁",
    title: "Saved to the Cloud",
    body: "Every map is persisted to your account. Open, rename, and delete maps from your dashboard.",
    accent: "from-accent-violet/60 to-indigo-400",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <div className="eyebrow mb-4 justify-center sm:mb-5">The core structure</div>
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          A canvas that thinks alongside you
        </h2>
        <p className="mx-auto mt-4 max-w-lg px-2 text-sm leading-relaxed text-text-muted sm:mt-5">
          Mindly combines a modern infinite canvas with Claude&rsquo;s
          reasoning, so every node becomes a conversation starter.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="card group relative overflow-hidden p-5 transition-all duration-300 hover:border-accent-violet/50 hover:-translate-y-0.5 sm:p-7"
          >
            <div className="mb-4 flex items-center gap-3 sm:mb-5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white sm:h-9 sm:w-9 ${f.accent}`}
              >
                {f.icon}
              </div>
              <span className="text-xs font-semibold text-text-faint">0{i + 1}</span>
            </div>
            <h3 className="text-sm font-semibold tracking-tight sm:text-base">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{f.body}</p>
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-accent-violet/15 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </div>
        ))}
      </div>
    </section>
  );
}
