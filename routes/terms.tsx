import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { DUE_DILIGENCE } from "@/lib/directory";
import { MIN_AGE } from "@/lib/privacy";

export const Route = createFileRoute("/terms")({ component: TermsPage });

function TermsPage() {
  return (
    <Shell>
      <article className="mx-auto max-w-2xl">
        <h1 className="font-display text-title">Terms</h1>
        <div className="mt-4 grid gap-3 text-sm leading-relaxed">
          <p>You must be over {MIN_AGE} to publish a profile. Talent Finder Africa asks for real photos of the work.</p>
          <p>You confirm that the photos are of your own work, or work you have the right to show. A false claim can lead to removal.</p>
          <p>Talent Finder Africa checks the work shown. It never says a person is verified or guaranteed.</p>
          <p>{DUE_DILIGENCE}</p>
          <p>You can hide or delete your profile at any time. An active plan is not refunded automatically when you delete the profile.</p>
        </div>
      </article>
    </Shell>
  );
}
