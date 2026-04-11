"use client";

import { useState } from "react";

const items = [
  {
    q: "Is Mindly free to use?",
    a: "Yes — create an account and start mapping for free. Your maps are saved to the cloud and accessible from any device.",
  },
  {
    q: "Do I need an Anthropic API key?",
    a: "No. The Claude integration is handled on the server side. Just sign in and click \"Expand with Claude\" on any node.",
  },
  {
    q: "How does the AI node generation work?",
    a: "Select a node and either click the default expand button or type a short instruction in the AI panel. Claude reads the node's content and generates a cluster of relevant child nodes linked directly to your selection.",
  },
  {
    q: "Can I have multiple mind maps?",
    a: "Yes. Your dashboard lists all your saved maps. Create as many as you need, rename them, or delete the ones you no longer need.",
  },
  {
    q: "What node types are available?",
    a: "Six types: Idea (free-form text), Task (with due date and completion), Budget (amount + currency), Place (location), Event (date + location), and a root Project node.",
  },
  {
    q: "Is my data private?",
    a: "Each map is tied to your account via Supabase row-level security. Only you can read or modify your maps.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <div className="eyebrow mb-4 justify-center sm:mb-5">FAQ</div>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          Questions &amp; answers
        </h2>
      </div>

      <div className="mt-10 space-y-2 sm:mt-14 sm:space-y-3">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={item.q}
              className={`rounded-2xl border transition-all duration-200 ${
                isOpen
                  ? "border-accent-violet/40 bg-accent-violet/5"
                  : "border-border-subtle bg-bg-card hover:border-border-strong"
              }`}
            >
              <button
                className="flex w-full items-start justify-between px-5 py-4 text-left sm:px-6 sm:py-5"
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span className="mr-4 text-sm font-medium text-text-primary leading-snug">
                  {item.q}
                </span>
                <span
                  className={`mt-0.5 flex-shrink-0 text-lg text-accent-violet transition-transform duration-200 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm leading-relaxed text-text-muted sm:px-6">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
