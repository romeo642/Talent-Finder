import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function buttonClass(variant: "primary" | "secondary" | "ghost" = "primary", full = false) {
  return cn(
    "inline-flex h-12 items-center justify-center gap-2 rounded-control px-5 text-sm font-semibold",
    "transition-opacity duration-150 ease-out",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:cursor-not-allowed disabled:opacity-50",
    full && "w-full",
    variant === "primary" && "bg-accent text-accent-fg hover:opacity-90",
    variant === "secondary" && "border border-line-strong bg-paper text-ink hover:bg-bg",
    variant === "ghost" && "bg-transparent text-ink hover:bg-ink/5",
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  full?: boolean;
};

export function Button({ variant = "primary", full, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonClass(variant, full), className)} {...props} />;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-2 block text-sm text-muted">{hint}</span> : null}
    </label>
  );
}

export const controlClass =
  "h-12 w-full rounded-control border border-line bg-paper px-4 text-base text-ink outline-none placeholder:text-faint focus:border-accent";

export function Note({ tone = "danger", children }: { tone?: "danger" | "ok"; children: ReactNode }) {
  return (
    <p
      className={cn(
        "rounded-control px-4 py-3 text-sm",
        tone === "danger" ? "bg-danger-bg text-danger" : "bg-ok-bg text-ok",
      )}
      role={tone === "danger" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-control bg-line", className)} />;
}
