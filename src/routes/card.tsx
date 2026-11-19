import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { OwnerTrust } from "@/components/passport";
import { SignInPanel } from "@/components/sign-in-panel";
import { buttonClass, Note, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { placeLine, yearsLabel, type PublicListing } from "@/lib/directory";
import { socialCode } from "@/lib/social-check";
import { getMine } from "@/lib/listings-api";
import { decideHire, myHireRequests } from "@/lib/hire-api";
import { deleteProfile, downloadMyData, hideProfile, appealHidden, clearContact } from "@/lib/privacy-api";
import { purchasePlan } from "@/lib/plans-api";
import { getWallet, moneyLabel } from "@/lib/pay/wallet";
import { providersForCountry } from "@/lib/pay/index";
import { PLAN_CONFIG, planPrice } from "@/lib/plans";
import { methodsFor } from "@/lib/payments";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/card")({ component: CardPage });

function CardPage() {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id;
  const [listing, setListing] = useState<PublicListing | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [wallet, setWallet] = useState<{ currency: string; available: number }[]>([]);

  useEffect(() => {
    if (!userId) return;
    let cancel = false;
    getMine()
      .then((result) => {
        if (cancel) return;
        if (!result.ok) {
          setError(result.error);
          setListing(null);
          return;
        }
        setListing(result.data);
      })
      .catch(() => {
        if (!cancel) {
          setError("Could not load your ID.");
          setListing(null);
        }
      });
    void getWallet().then((result) => {
      if (!cancel && result.ok) setWallet(result.data);
    });
    return () => {
      cancel = true;
    };
  }, [userId]);

  if (isPending) {
    return (
      <Shell>
        <Skeleton className="h-64" />
      </Shell>
    );
  }
  if (!user) {
    return (
      <Shell>
        <SignInPanel title="Sign in to see your Talent Finder ID" callbackURL="/card" />
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-display text-title">Your Talent Finder ID</h1>
      {error ? (
        <div className="mt-4">
          <Note>{error}</Note>
        </div>
      ) : null}
      {listing === undefined ? (
        <Skeleton className="mt-6 h-64" />
      ) : listing === null ? (
        <div className="mt-6 max-w-lg">
          <p className="text-muted">You have not published a listing yet. The Ghana fee is GHS 20, paid through Paystack.</p>
          <Link to="/list" className={cn(buttonClass(), "mt-6")}>
            List your work
          </Link>
        </div>
      ) : (
        <article className="mt-6 grid gap-6 md:grid-cols-2">
          <img
            src={listing.photo}
            alt=""
            className="aspect-work w-full rounded-card object-cover"
          />
          <div className="rounded-card border border-line bg-paper p-5">
            <p className="font-mono text-sm tracking-wide">{listing.id}</p>
            <h2 className="mt-3 font-display text-3xl">{listing.displayName}</h2>
            <p className="mt-2 text-muted">
              {listing.skillName} · {yearsLabel(listing.years)}
            </p>
            <p className="mt-2 text-sm text-muted">{placeLine(listing)}</p>
            <p className="mt-4 text-sm">
              {listing.contactActive &&
              (listing.phone || listing.email || listing.facebook || listing.instagram || listing.tiktok || listing.twitter)
                ? [listing.phone, listing.email, listing.facebook && `@${listing.facebook}`, listing.instagram && `@${listing.instagram}`, listing.tiktok && `@${listing.tiktok}`, listing.twitter && `@${listing.twitter}`]
                    .filter(Boolean)
                    .join(" · ")
                : "Contact is hidden."}
            </p>
            <SocialCodes listing={listing} />
            <HireInbox />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/p/$tapId" params={{ tapId: listing.id }} className={buttonClass()}>
                View public page
              </Link>
              <Link to="/list" className={buttonClass("secondary")}>
                Update
              </Link>
            </div>
          </div>
          <OwnerTrust listing={listing} />
          <section className="max-w-lg rounded-card border border-line bg-paper p-5 md:col-span-2">
            <h2 className="font-display text-2xl">Wallet</h2>
            <p className="mt-2 text-sm text-muted">
              {wallet.length === 0
                ? "No wallet balance yet. Staff can add money. Card and mobile money still settle through Paystack."
                : wallet.map((row) => moneyLabel(row.currency, row.available)).join(" · ")}
            </p>
          </section>
          <PlanPay country={listing.countryCode} />
          <ProfileSettings
            listed={listing.listed}
            hiddenReason={listing.hiddenReason}
            onChanged={() => {
              setListing(null);
              window.location.assign("/card");
            }}
          />
        </article>
      )}
    </Shell>
  );
}

function PlanPay({ country }: { country: string }) {
  const choices = providersForCountry(country);
  const [providerId, setProviderId] = useState(choices[0]?.id ?? "");
  const [note, setNote] = useState("");
  const method = methodsFor(country)[0];

  async function pay(planId: string) {
    setNote("");
    const result = await purchasePlan({
      data: { planId, payMethod: method?.id ?? "", origin: window.location.origin, providerId },
    });
    if (!result.ok) {
      setNote(result.error);
      return;
    }
    if (result.data.status === "switched") {
      setNote("Plan updated. Every plan costs the same, so there is no extra fee.");
      return;
    }
    if (result.data.status === "choose") {
      setNote(result.data.providers.map((item) => item.label).join(" or ") + ".");
      return;
    }
    if (result.data.authorizationUrl) window.location.assign(result.data.authorizationUrl);
  }

  if (choices.length === 0) {
    return (
      <section className="max-w-lg rounded-card border border-line bg-paper p-5 md:col-span-2">
        <h2 className="font-display text-2xl">Plans</h2>
        <p className="mt-2 text-sm text-muted">Paid plans are not available in this country yet. Paystack does not cover it. Your free trial still works.</p>
      </section>
    );
  }

  return (
    <section className="max-w-lg rounded-card border border-line bg-paper p-5 md:col-span-2">
      <h2 className="font-display text-2xl">Plans</h2>
      {choices.length > 1 ? (
        <div className="mt-3 grid gap-2">
          {choices.map((choice) => (
            <button key={choice.id} type="button" className="rounded-control border border-line px-3 py-2 text-left text-sm" onClick={() => setProviderId(choice.id)}>
              {choice.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">{choices[0].label}</p>
      )}
      <ul className="mt-4 grid gap-3">
        {PLAN_CONFIG.plans.map((plan) => (
          <li key={plan.id} className="flex items-center justify-between gap-3 text-sm">
            <span>
              {plan.name} · {planPrice(country, plan.id).label} / year
            </span>
            <button type="button" className="font-semibold text-accent" onClick={() => void pay(plan.id)}>
              Pay
            </button>
          </li>
        ))}
      </ul>
      {note ? <p className="mt-3 text-sm">{note}</p> : null}
    </section>
  );
}

function ProfileSettings({ listed, hiddenReason, onChanged }: { listed: boolean; hiddenReason: string; onChanged: () => void }) {
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <section className="mt-6 max-w-lg rounded-card border border-line bg-paper p-5">
      <h2 className="font-display text-2xl">Settings</h2>
      <p className="mt-2 text-sm text-muted">{listed ? "Your profile is public." : "Your profile is a draft. It is not on public pages."}</p>
      <div className="mt-4 flex flex-col gap-3">
        {["phone", "email", "facebook", "instagram", "twitter", "tiktok"].map((field) => (
          <button
            key={field}
            type="button"
            className="text-left text-sm font-semibold text-accent"
            onClick={() => {
              void clearContact({ data: { field } }).then((result) => {
                if (result.ok) setNote(result.data.message);
                onChanged();
              });
            }}
          >
            Remove {field}
          </button>
        ))}
        {hiddenReason ? (
          <form
            className="grid gap-2 text-sm"
            onSubmit={(event) => {
              event.preventDefault();
              const note = new FormData(event.currentTarget).get("note");
              void appealHidden({ data: { note: String(note ?? "") } }).then((result) => {
                if (result.ok) setNote(result.data.message);
                else setNote(result.error);
              });
            }}
          >
            <p>This profile is hidden: {hiddenReason}</p>
            <input name="note" className="h-11 rounded-control border border-line px-3" placeholder="Send proof and ask for a review" />
            <button type="submit" className="text-left font-semibold text-accent">
              Appeal
            </button>
          </form>
        ) : null}
        <button
          type="button"
          className="text-left text-sm font-semibold text-accent"
          onClick={() => {
            void hideProfile().then(() => onChanged());
          }}
        >
          Hide my profile
        </button>
        <button
          type="button"
          className="text-left text-sm font-semibold text-accent"
          onClick={() => {
            void downloadMyData().then((result) => {
              if (!result.ok) return;
              const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "talent-finder-data.json";
              link.click();
              URL.revokeObjectURL(url);
            });
          }}
        >
          Download my data
        </button>
        {confirmDelete ? (
          <div className="grid gap-2 text-sm">
            <p>Delete the profile? An active plan is not refunded automatically. Photos and contact details are removed. Payment records stay where the law requires them.</p>
            <button
              type="button"
              className="text-left font-semibold text-accent"
              onClick={() => {
                void deleteProfile().then((result) => {
                  if (result.ok) setNote(result.data.message);
                  onChanged();
                });
              }}
            >
              Yes, delete my profile
            </button>
          </div>
        ) : (
          <button type="button" className="text-left text-sm font-semibold text-accent" onClick={() => setConfirmDelete(true)}>
            Delete my profile
          </button>
        )}
      </div>
      {note ? <p className="mt-3 text-sm">{note}</p> : null}
    </section>
  );
}

function HireInbox() {
  const [rows, setRows] = useState<{ id: string; note: string; status: string; seeker_name: string }[]>([]);
  function load() {
    void myHireRequests().then((result) => {
      if (result.ok) setRows(result.data);
    });
  }
  useEffect(() => {
    load();
  }, []);
  const waiting = rows.filter((row) => row.status === "pending");
  if (waiting.length === 0) return null;
  return (
    <div className="mt-4 grid gap-3">
      <p className="text-sm font-medium">Hire requests</p>
      {waiting.map((row) => (
        <div key={row.id} className="rounded-control border border-line p-3 text-sm">
          <p className="font-medium">{row.seeker_name}</p>
          <p className="mt-1 text-muted">{row.note}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button type="button" className="font-semibold text-accent" onClick={() => void decideHire({ data: { id: row.id, accept: true, revealPhone: false } }).then(load)}>
              Accept email
            </button>
            <button type="button" className="font-semibold text-accent" onClick={() => void decideHire({ data: { id: row.id, accept: true, revealPhone: true } }).then(load)}>
              Accept email and phone
            </button>
            <button type="button" className="font-semibold text-muted" onClick={() => void decideHire({ data: { id: row.id, accept: false } }).then(load)}>
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SocialCodes({ listing }: { listing: PublicListing }) {
  const rows = [
    listing.facebook ? ["Facebook", "facebook"] : null,
    listing.instagram ? ["Instagram", "instagram"] : null,
    listing.tiktok ? ["TikTok", "tiktok"] : null,
    listing.twitter ? ["X", "twitter"] : null,
  ].filter((row): row is [string, string] => Boolean(row));
  if (rows.length === 0) return null;
  return (
    <ul className="mt-4 grid gap-2 text-sm text-muted">
      {rows.map(([label, network]) => (
        <li key={network}>
          Put {socialCode(listing.id, network)} in your {label} bio so a client can check it.
        </li>
      ))}
    </ul>
  );
}
