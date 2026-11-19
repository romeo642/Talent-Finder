import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { previewPathRewrite } from "@/lib/preview-path-prefix";
import { routeTree } from "./routeTree.gen";
import { Shell } from "@/components/shell";
import { Link } from "@tanstack/react-router";

function NotFound() {
  return (
    <Shell>
      <h1 className="font-display text-title">That page is not on Talent Finder.</h1>
      <p className="mt-3 text-muted">The link may be old, or the ID may be typed wrong.</p>
      <Link to="/" className="mt-6 inline-flex text-sm font-semibold text-accent">
        Back home
      </Link>
    </Shell>
  );
}

export function getRouter() {
  return createRouter({
    routeTree,
    rewrite: previewPathRewrite(),
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: NotFound,
  });
}
