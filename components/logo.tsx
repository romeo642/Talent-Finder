import { cn } from "@/lib/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
      <img src="/mark.jpg?v=finder" alt="" className="size-14 shrink-0 object-contain sm:size-16" />
      <span className="flex min-w-0 flex-col">
        <span className="font-sans text-xl font-bold leading-none tracking-tight text-ink sm:text-2xl">Talent Finder</span>
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
          Find skill. See potential. Build better.
        </span>
      </span>
    </span>
  );
}
