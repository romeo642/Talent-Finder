import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Thread } from "@/components/thread";
import { Disclaimer } from "@/components/disclaimer";
import { WorkReviews } from "@/components/work-reviews";
import { SkillPassport } from "@/components/passport";
import { Shell } from "@/components/shell";
import { Button, buttonClass, Note, Skeleton } from "@/components/ui";
import { QrMark } from "@/components/qr-mark";
import { formatPhone, idMoved, opensLabel, placeLine, yearsLabel, type PublicListing } from "@/lib/directory";
import { socialCode } from "@/lib/social-check";
import { getListing } from "@/lib/listings-api";
import { readHomeCountry } from "@/lib/home-country";
import { acceptedContact, sendHireRequest } from "@/lib/hire-api";
import { reportProfile } from "@/lib/privacy-api";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/p/$tapId")({ component: ProfilePage });

function ProfilePage() {
  const { tapId } = Route.useParams();
  const [listing, setListing] = useState<PublicListing | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    let cancel = false;
    setListing(undefined);
    let count = true;
    try {
      const seenKey = `tap-open:${tapId}`;
      count = window.sessionStorage.getItem(seenKey) !== "1";
      if (count) window.sessionStorage.setItem(seenKey, "1");
    } catch {
      count = false;
    }
    getListing({ data: { id: tapId, count, viewerCountry: readHomeCountry() } })
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
          setError("Could not open this ID.");
          setListing(null);
        }
      });
    return () => {
      cancel = true;
    };
  }, [tapId]);

  useEffect(() => {
    setShareUrl(window.location.href);
  }, [tapId]);

  return (
    <Shell>
      {listing === undefined ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : listing === null ? (
        <div>
          <h1 className="font-display text-title">No listing for that ID</h1>
          <p className="mt-3 text-muted">Check the code, or search by town and skill.</p>
          {error ? (
            <div className="mt-4">
              <Note>{error}</Note>
            </div>
          ) : null}
          <Link to="/find" className="mt-6 inline-flex text-sm font-semibold text-accent">
            Browse the directory
          </Link>
        </div>
      ) : listing.restricted ? (
        <div className="max-w-lg">
          <h1 className="font-display text-title">Available in {listing.countryName}</h1>
          <p className="mt-3 text-muted">
            This {listing.skillName.toLowerCase()} is listed in {listing.countryName}. Open that country to see the people there. Nothing else from this profile is shown.
          </p>
          <Link to="/country/$code" params={{ code: listing.countryCode }} className="mt-6 inline-flex text-sm font-semibold text-accent">
            Open {listing.countryName}
          </Link>
        </div>
      ) : (
        <article className="grid gap-6 md:grid-cols-2">
          <img
            src={listing.photo}
            alt={`${listing.displayName}'s best work as a ${listing.skillName.toLowerCase()}`}
            className="aspect-work w-full rounded-card object-cover"
          />
          <div>
            <p className="text-sm font-medium text-muted">{listing.skillName}</p>
            <h1 className="mt-2 font-display text-title">{listing.displayName}</h1>
            <WorkChecked show={listing.workChecked} />
            {listing.staffVerified ? (
              <p className="mt-3 text-sm text-muted" title="A staff member looked at the photos of the work. This is not a guarantee.">
                Staff checked this account. This is not a guarantee.
              </p>
            ) : null}
            <p className="mt-2 text-muted">
              {yearsLabel(listing.years)} · {placeLine(listing)}
            </p>
            <p className="mt-2 text-sm text-muted">{opensLabel(listing.views)}</p>
            <p className="mt-5 font-mono text-sm tracking-wide text-ink">{listing.id}</p>
            <p className="mt-1 text-xs text-muted">Country · region · town · community · number</p>
            {idMoved(listing) ? (
              <p className="mt-2 text-sm text-muted">
                This ID was issued for an earlier place and does not change if they move. The location above is current.
              </p>
            ) : null}
            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(listing.id).then(() => {
                    setCopied(true);
                  });
                }}
              >
                {copied ? "Copied" : "Copy ID"}
              </Button>
            </div>
            {listing.sample ? (
              <p className="mt-4 text-sm text-muted">Sample profile. This is not a real person.</p>
            ) : null}
          </div>
          <section className="md:col-span-2">
            <h2 className="font-display text-2xl">Experience</h2>
            <p className="mt-3 max-w-3xl leading-relaxed">{listing.experience}</p>
          </section>
          <section className="rounded-card border border-line bg-paper p-5 md:col-span-2">
            <h2 className="font-display text-2xl">Contact</h2>
            <p className="mt-2 text-sm text-muted">Social accounts can be public. Phone and email stay hidden until this person accepts a request.</p>
            {listing.sample ? (
              <p className="mt-3 text-sm text-muted">Hidden on sample profiles. This is not a real person.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {listing.facebook ? (
                  <a className={buttonClass("secondary")} href={`https://facebook.com/${listing.facebook}`} target="_blank" rel="noreferrer">
                    Facebook · @{listing.facebook}
                  </a>
                ) : null}
                {listing.instagram ? (
                  <a className={buttonClass("secondary")} href={`https://instagram.com/${listing.instagram}`} target="_blank" rel="noreferrer">
                    Instagram · @{listing.instagram}
                  </a>
                ) : null}
                {listing.tiktok ? (
                  <a className={buttonClass("secondary")} href={`https://www.tiktok.com/@${listing.tiktok}`} target="_blank" rel="noreferrer">
                    TikTok · @{listing.tiktok}
                  </a>
                ) : null}
                {listing.twitter ? (
                  <a className={buttonClass("secondary")} href={`https://x.com/${listing.twitter}`} target="_blank" rel="noreferrer">
                    X · @{listing.twitter}
                  </a>
                ) : null}
                {!listing.facebook && !listing.instagram && !listing.tiktok && !listing.twitter ? (
                  <p className="text-sm text-muted">No social account is listed.</p>
                ) : null}
                <SocialChecks listing={listing} />
                <HireBox id={listing.id} />
              </div>
            )}
            {shareUrl ? (
              <div className="mt-5">
                <QrMark text={shareUrl} caption="Scan to open this Talent Finder ID" />
              </div>
            ) : null}
          </section>
          <SkillPassport listing={listing} />
          <WorkReviews listingId={listing.id} />
          {listing.documentName ? (
            <p className="text-sm md:col-span-2">
              <a className="font-semibold text-accent" href={`/docs/${listing.id}`} target="_blank" rel="noreferrer">
                Open work document · {listing.documentName}
              </a>
            </p>
          ) : null}
          <ReportBox id={listing.id} />
          <div className="md:col-span-2">
            <Disclaimer compact />
          </div>
        </article>
      )}
    </Shell>
  );
}

function HireBox({ id }: { id: string }) {
  const { user } = useCurrentUserState();
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [contact, setContact] = useState<{ email: string | null; phone: string | null; requestId: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    void acceptedContact({ data: { id } }).then((result) => {
      if (result.ok) setContact(result.data);
    });
  }, [id, user]);

  if (!user) {
    return (
      <p className="text-sm">
        <Link to="/login" search={{}} className="font-semibold text-accent">
          Sign in
        </Link>{" "}
        to request this person's email or phone.
      </p>
    );
  }
  if (contact) {
    return (
      <div className="rounded-control bg-bg p-3 text-sm">
        <p className="font-medium text-ink">Accepted. These details are only for you.</p>
        {contact.email ? <p className="mt-1">{contact.email}</p> : <p className="mt-1 text-muted">No email was saved.</p>}
        {contact.phone ? <p className="mt-1">{formatPhone(contact.phone)}</p> : null}
        <div className="mt-3">
          <Thread requestId={contact.requestId} />
        </div>
      </div>
    );
  }
  if (sent) return <p className="text-sm text-muted">Request sent. Phone and email stay hidden until they accept.</p>;
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        void sendHireRequest({ data: { id, note } }).then((result) => {
          if (!result.ok) setError(result.error);
          else setSent(true);
        });
      }}
    >
      <label className="text-sm font-medium" htmlFor="hire-note">
        Request to hire
      </label>
      <textarea
        id="hire-note"
        value={note}
        maxLength={180}
        onChange={(event) => setNote(event.target.value)}
        className="min-h-20 rounded-control border border-line bg-paper p-3 text-sm"
        placeholder="The job, the place, and the day."
      />
      <Button type="submit">Send request</Button>
      {error ? <Note>{error}</Note> : null}
    </form>
  );
}

function WorkChecked({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p
      className="mt-4 inline-flex max-w-full items-center gap-3 rounded-full border border-accent bg-[#e7f6f6] py-1.5 pr-4 pl-1.5"
      title="Work checked means at least three dated photos of the work, no duplicate photos, and either a staff review, three neighbour vouches, or five hired-and-good answers. It does not mean the person is verified or guaranteed."
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-fg" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.6">
          <path d="M5 12.5 9.2 17 19 7" />
        </svg>
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink">Work checked</span>
        <span className="block text-xs text-accent">The work shown was checked. Not a verified person.</span>
      </span>
    </p>
  );
}

function SocialChecks({ listing }: { listing: PublicListing }) {
  const rows = [
    listing.facebook ? ["Facebook", listing.facebook, "facebook"] : null,
    listing.instagram ? ["Instagram", listing.instagram, "instagram"] : null,
    listing.tiktok ? ["TikTok", listing.tiktok, "tiktok"] : null,
    listing.twitter ? ["X", listing.twitter, "twitter"] : null,
  ].filter((row): row is [string, string, string] => Boolean(row));
  if (rows.length === 0) return null;
  return (
    <div className="rounded-control bg-bg p-3 text-sm leading-relaxed text-muted">
      <p className="font-medium text-ink">Check the socials yourself</p>
      <p className="mt-1">
        Talent Finder does not log into Facebook, TikTok, X, or Instagram. Open the profile and look for the code in the
        bio or a post.
      </p>
      <ul className="mt-2 grid gap-1">
        {rows.map(([label, handle, network]) => (
          <li key={network}>
            {label} @{handle}: {socialCode(listing.id, network)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReportBox({ id }: { id: string }) {
  const [reason, setReason] = useState("fake");
  const [sent, setSent] = useState(false);
  if (sent) return <p className="text-sm text-muted md:col-span-2">Report sent. Talent Finder Africa does not call anyone a verified person.</p>;
  return (
    <form
      className="grid gap-3 md:col-span-2"
      onSubmit={(event) => {
        event.preventDefault();
        void reportProfile({ data: { id, reason } }).then((result) => {
          if (result.ok) setSent(true);
        });
      }}
    >
      <h2 className="font-display text-2xl">Report this profile</h2>
      <p className="text-sm text-muted">Talent Finder Africa checks the work shown in the photos. It does not guarantee anyone.</p>
      <select value={reason} onChange={(event) => setReason(event.target.value)} className="h-12 rounded-control border border-line bg-paper px-3">
        <option value="not their work">Not their work</option>
        <option value="fake">Fake</option>
        <option value="unsafe">Unsafe</option>
        <option value="abusive">Abusive</option>
        <option value="other">Other</option>
      </select>
      <Button type="submit">Send report</Button>
    </form>
  );
}
