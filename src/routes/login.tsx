import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { SignInPanel } from "@/components/sign-in-panel";
import { Skeleton } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

type LoginSearch = { mode?: "up" };

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch =>
    search.mode === "up" ? { mode: "up" } : {},
  component: LoginPage,
});

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const { mode } = Route.useSearch();
  if (isPending) {
    return (
      <Shell>
        <Skeleton className="mx-auto h-64 max-w-md" />
      </Shell>
    );
  }
  if (user && mode !== "up") return <Navigate to="/card" />;
  return (
    <Shell>
      <SignInPanel callbackURL="/card" mode={mode === "up" ? "up" : "in"} />
    </Shell>
  );
}
