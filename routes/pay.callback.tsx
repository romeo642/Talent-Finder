import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { SignInPanel } from "@/components/sign-in-panel";
import { buttonClass, Note, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { PublicListing } from "@/lib/directory";
import { confirmPreview, finalizePaystack } from "@/lib/listings-api";
import { readPayment } from "@/lib/pay/orders";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/pay/callback")({ component: CallbackPage });

function CallbackPage() {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id;
  const [listing, setListing] = useState<PublicListing | null>(null);
  const [receipt, setReceipt] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(true);
  const [callbackURL, setCallbackURL] = useState("/pay/callback");

  useEffect(() => {
    setCallbackURL(`/pay/callback${window.location.search}`);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") ?? params.get("trxref") ?? "";
    const preview = params.get("preview") === "1";
    if (!reference) {
      setConfirming(false);
      setError("Missing payment reference.");
      return;
    }
    let stopped = false;
    const started = Date.now();
    async function look() {
      if (preview) {
        const result = await confirmPreview({ data: { reference } });
        if (stopped) return;
        setConfirming(false);
        if (!result.ok) setError(result.error);
        else setListing(result.data);
        return;
      }
      const order = await readPayment({ data: { reference } });
      if (stopped) return;
      if (order.ok && order.data.state === "paid") {
        setConfirming(false);
        setReceipt(order.data.receipt);
        return;
      }
      if (order.ok && (order.data.state === "failed" || order.data.state === "expired" || order.data.state === "refunded")) {
        setConfirming(false);
        setError(order.data.state === "expired" ? "This payment expired. Start again with a new reference." : "This payment did not go through.");
        return;
      }
      const listingResult = await finalizePaystack({ data: { reference } });
      if (stopped) return;
      if (listingResult.ok) {
        setConfirming(false);
        setListing(listingResult.data);
        return;
      }
      if (Date.now() - started > 120_000) {
        setConfirming(false);
        setError("Still confirming payment. If the money left your account, the plan will turn on when the provider confirms it.");
        return;
      }
      window.setTimeout(() => {
        void look();
      }, 3000);
    }
    void look().catch(() => {
      if (!stopped) {
        setConfirming(false);
        setError("Could not read the payment.");
      }
    });
    return () => {
      stopped = true;
    };
  }, [userId]);

  if (isPending) {
    return (
      <Shell>
        <Skeleton className="h-48" />
      </Shell>
    );
  }
  if (!user) {
    return (
      <Shell>
        <SignInPanel title="Sign in to see your payment" callbackURL={callbackURL} />
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-display text-title">{listing || receipt ? "Payment" : "Confirming payment"}</h1>
      {confirming ? (
        <p className="mt-4 text-sm text-muted">Confirming payment. This page only shows the result.</p>
      ) : null}
      {error ? (
        <div className="mt-6 max-w-lg">
          <Note>{error}</Note>
        </div>
      ) : null}
      {receipt ? (
        <pre className="mt-6 max-w-lg whitespace-pre-wrap rounded-card border border-line bg-paper p-6 text-sm">{receipt}</pre>
      ) : null}
      {listing ? (
        <div className="mt-6 max-w-lg rounded-card border border-line bg-paper p-6">
          <p className="font-mono text-lg tracking-wide">{listing.id}</p>
          <p className="mt-3 text-sm text-muted">
            {listing.displayName} · {listing.skillName}
          </p>
          <Link to="/p/$tapId" params={{ tapId: listing.id }} className={cn(buttonClass(), "mt-6")}>
            Open your public page
          </Link>
        </div>
      ) : null}
    </Shell>
  );
}
