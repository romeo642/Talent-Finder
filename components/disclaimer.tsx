import { DUE_DILIGENCE } from "@/lib/directory";

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <section className="rounded-card bg-accent px-5 py-6 text-accent-fg sm:px-8 sm:py-8">
      <h2 className="font-display text-title">Due diligence</h2>
      <p className={compact ? "mt-3 text-sm leading-relaxed" : "mt-3 max-w-3xl leading-relaxed"}>
        {DUE_DILIGENCE}
      </p>
    </section>
  );
}
