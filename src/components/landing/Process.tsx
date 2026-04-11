const steps = [
  {
    number: "01",
    title: "Create a map",
    body: "Sign in and open the canvas. A root node with your project title sits at the center — rename it to anything.",
    accent: "border-accent-violet/50 bg-accent-violet/5",
  },
  {
    number: "02",
    title: "Add nodes your way",
    body: "Click Idea, Task, Budget, Place, or Event in the toolbar. Each type shows the right fields — amounts, dates, locations.",
    accent: "border-accent-indigo/50 bg-accent-indigo/5",
  },
  {
    number: "03",
    title: "Connect the dots",
    body: "Drag from any handle to another node to draw an edge. Build trees, webs, or timelines — the canvas has no opinion.",
    accent: "border-sky-500/40 bg-sky-500/5",
  },
  {
    number: "04",
    title: "Let Claude expand it",
    body: "Select a node and click Expand with Claude. Or type a short instruction — Claude generates a cluster of linked child nodes instantly.",
    accent: "border-fuchsia-500/40 bg-fuchsia-500/5",
  },
];

export default function Process() {
  return (
    <section id="process" className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <div className="eyebrow mb-4 justify-center sm:mb-5">How it works</div>
        <h2 className="mx-auto max-w-xl px-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          From blank canvas to full plan in minutes
        </h2>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-3 sm:mt-16 sm:grid-cols-2 sm:gap-4">
        {steps.map((s, i) => (
          <div
            key={s.number}
            className={`relative rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 sm:p-7 ${s.accent}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border-strong bg-bg-card text-xs font-bold text-text-muted sm:h-10 sm:w-10">
                {s.number}
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-tight sm:text-base">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{s.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center sm:mt-14">
        <a href="/auth/signup" className="btn-primary">
          Try it free →
        </a>
      </div>
    </section>
  );
}
