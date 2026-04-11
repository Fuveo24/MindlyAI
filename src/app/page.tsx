import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Process from "@/components/landing/Process";
import FAQ from "@/components/landing/FAQ";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-glow-radial" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-glow-bottom" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10">
        <Nav />
        <Hero />
        <Features />
        <Process />
        <FAQ />

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="card glow-ring relative overflow-hidden rounded-2xl p-8 text-center sm:rounded-3xl sm:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-violet/10 to-accent-indigo/5"
            />
            <div className="relative">
              <div className="eyebrow mb-4 justify-center sm:mb-5">Start now</div>
              <h2 className="mx-auto max-w-xl px-2 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Your next big idea starts with a single node
              </h2>
              <p className="mx-auto mt-3 max-w-md px-2 text-sm text-text-muted sm:mt-4">
                Free to use. No credit card required. Maps are saved automatically.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
                <Link href="/auth/signup" className="btn-primary w-full max-w-[240px] justify-center sm:w-auto">
                  Create your first map
                </Link>
                <Link href="/auth/login" className="btn-outline w-full max-w-[240px] justify-center sm:w-auto">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="mx-auto max-w-6xl border-t border-border-subtle px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex flex-col items-center gap-2 text-center text-xs text-text-faint sm:flex-row sm:justify-between sm:text-left">
            <span>© 2026 Mindly</span>
            <span>Built with Next.js, React Flow &amp; Claude</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
