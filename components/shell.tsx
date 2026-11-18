import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Globe, House, IdCard, Plus, Search } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { UserButton } from "@/lib/auth/gates";
import { Logo } from "@/components/logo";
import { InstallApp } from "@/components/install-app";
import { DUE_DILIGENCE } from "@/lib/directory";

const LINKS = [
  { to: "/", label: "Home", icon: House },
  { to: "/countries", label: "Countries", icon: Globe },
  { to: "/list", label: "List", icon: Plus },
  { to: "/card", label: "My ID", icon: IdCard },
] as const;

function HeaderSearch() {
  const navigate = useNavigate();
  const routeQuery = useRouterState({
    select: (state) => {
      const search = state.location.search as { q?: string };
      return typeof search.q === "string" ? search.q : "";
    },
  });
  const [q, setQ] = useState(routeQuery);

  useEffect(() => {
    setQ(routeQuery);
  }, [routeQuery]);

  return (
    <form
      className="mt-2"
      onSubmit={(event) => {
        event.preventDefault();
        void navigate({ to: "/find", search: { q: q.trim() } });
      }}
    >
      <label className="sr-only" htmlFor="header-search">
        Search a skill, town, name, or Talent Finder ID
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
        <input
          id="header-search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search a skill, town, name, or Talent Finder ID"
          className="h-11 w-full rounded-control border border-line bg-bg pr-4 pl-10 text-sm outline-none placeholder:text-faint focus:border-accent"
        />
      </div>
    </form>
  );
}
function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div className="h-9 w-9 animate-pulse rounded-full bg-line" />;
  if (user) return <UserButton />;
  return (
    <div className="flex items-center gap-4">
      <Link
        to="/login"
        search={{ mode: "up" }}
        className="text-sm font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Sign up
      </Link>
      <Link
        to="/login"
        className="text-sm font-semibold text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Sign in
      </Link>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="tap-stage min-h-dvh text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-2">
          <div className="flex min-h-16 items-center justify-between gap-3">
            <Link
              to="/"
              aria-label="Talent Finder home"
              className="rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Logo />
            </Link>
            <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
              {LINKS.slice(1).map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-sm font-medium text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  activeProps={{ className: "text-sm font-semibold text-ink" }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <AuthSlot />
          </div>
          <HeaderSearch />
          <InstallApp />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 md:pb-16">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 pb-28 md:pb-10">
        <p className="text-sm leading-relaxed text-muted">{DUE_DILIGENCE}</p>
        <p className="mt-3 flex gap-4 text-sm">
          <Link to="/privacy" className="font-semibold text-accent">
            Privacy Policy
          </Link>
          <Link to="/terms" className="font-semibold text-accent">
            Terms
          </Link>
          <Link to="/match" className="font-semibold text-accent">
            Match
          </Link>
          <Link to="/inbox" className="font-semibold text-accent">
            Requests
          </Link>
          <Link to="/admin" className="font-semibold text-accent">
            Admin
          </Link>
        </p>
      </footer>
      <nav
        className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper md:hidden"
        aria-label="Primary"
      >
        <ul className="mx-auto grid max-w-5xl grid-cols-4">
          {LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted"
                  activeProps={{ className: "flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold text-ink" }}
                >
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
