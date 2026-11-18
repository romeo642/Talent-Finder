import { useEffect, useState, type FormEvent } from "react";
import { Button, controlClass, Note } from "@/components/ui";
import { compressPhoto } from "@/lib/photo";
import type { PublicListing } from "@/lib/directory";
import {
  addVouch,
  createJobConfirm,
  getPassport,
  practicalTestApplies,
  startPracticalTest,
  type Passport,
} from "@/lib/trust-api";

const KIND_LABEL = {
  association: "Trade association",
  school: "School",
  employer: "Past employer",
} as const;

export function SkillPassport({ listing }: { listing: PublicListing }) {
  const [passport, setPassport] = useState<Passport | null>(null);
  const [error, setError] = useState("");
  const [kind, setKind] = useState<"association" | "school" | "employer">("association");
  const [orgName, setOrgName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let cancel = false;
    getPassport({ data: { id: listing.id } })
      .then((result) => {
        if (cancel) return;
        if (!result.ok) setError(result.error);
        else setPassport(result.data);
      })
      .catch(() => {
        if (!cancel) setError("Could not load the work record.");
      });
    return () => {
      cancel = true;
    };
  }, [listing.id, sent]);

  async function vouch(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await addVouch({ data: { id: listing.id, kind, orgName, note } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSent(true);
      setOrgName("");
      setNote("");
    } catch {
      setError("Could not save that vouch.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-card border border-line bg-paper p-5 md:col-span-2">
      <h2 className="font-display text-2xl">Work record</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        The same badges and notes travel with this ID in Ghana, Nigeria, Côte d'Ivoire, and South Africa.
      </p>
      {passport ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          <li className="rounded-control border border-line px-3 py-3">
            <p className="text-sm font-medium">Confirmed by client</p>
            <p className="mt-1 font-display text-2xl">{passport.confirms}</p>
          </li>
          <li className="rounded-control border border-line px-3 py-3">
            <p className="text-sm font-medium">Vouches</p>
            <p className="mt-1 font-display text-2xl">{passport.vouches.length}</p>
          </li>
          <li className="rounded-control border border-line px-3 py-3">
            <p className="text-sm font-medium">Practical test</p>
            <p className="mt-1 font-display text-2xl">{passport.tests.length > 0 ? "Passed" : "None"}</p>
          </li>
        </ul>
      ) : null}
      {passport && passport.vouches.length > 0 ? (
        <ul className="mt-4 grid gap-3">
          {passport.vouches.map((vouch) => (
            <li key={vouch.id} className="rounded-control bg-bg px-3 py-3">
              <p className="text-sm font-medium">
                {KIND_LABEL[vouch.kind]} · {vouch.orgName}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{vouch.note}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {passport && passport.tests.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {passport.tests.map((test) => (
            <figure key={test.id}>
              <img src={test.photo} alt="" className="aspect-work w-full rounded-control object-cover" />
              <figcaption className="mt-2 text-sm text-muted">Passed · {test.skillName}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}
      {listing.sample ? null : (
        <form className="mt-6 grid gap-3" onSubmit={(event) => void vouch(event)}>
          <h3 className="font-display text-xl">Vouch for this person</h3>
          <p className="text-sm text-muted">A trade association, school, or past employer can leave one public vouch.</p>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Who you are</span>
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as typeof kind)}
              className={controlClass}
            >
              <option value="association">Trade association</option>
              <option value="school">School</option>
              <option value="employer">Past employer</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Organisation</span>
            <input value={orgName} onChange={(event) => setOrgName(event.target.value)} className={controlClass} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Why you vouch</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-24 w-full rounded-control border border-line bg-paper p-4 text-base outline-none focus:border-accent"
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : sent ? "Vouch saved" : "Publish vouch"}
          </Button>
        </form>
      )}
      {error ? (
        <div className="mt-4">
          <Note>{error}</Note>
        </div>
      ) : null}
    </section>
  );
}

export function OwnerTrust({ listing }: { listing: PublicListing }) {
  const [confirmUrl, setConfirmUrl] = useState("");
  const [testUrl, setTestUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function askClient() {
    setBusy("confirm");
    setError("");
    try {
      const result = await createJobConfirm();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const url = `${window.location.origin}/confirm/${result.data.token}`;
      setConfirmUrl(url);
    } catch {
      setError("Could not create the confirmation link.");
    } finally {
      setBusy("");
    }
  }

  async function submitTest(file: File) {
    setBusy("test");
    setError("");
    try {
      const photo = await compressPhoto(file);
      const result = await startPracticalTest({ data: { photo } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTestUrl(`${window.location.origin}/test/${result.data.token}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not submit the test.");
    } finally {
      setBusy("");
    }
  }

  const message = confirmUrl
    ? `Please confirm the job with ${listing.displayName}, ${listing.skillName}. Tap once: ${confirmUrl}`
    : "";

  return (
    <section className="mt-6 rounded-card border border-line bg-paper p-5 md:col-span-2">
      <h2 className="font-display text-2xl">After a job</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Send the client one link by WhatsApp or SMS. They tap once. The profile then shows confirmed by client.
      </p>
      <Button className="mt-4" onClick={() => void askClient()} disabled={busy !== ""}>
        {busy === "confirm" ? "Creating link…" : "Create confirmation link"}
      </Button>
      {confirmUrl ? (
        <div className="mt-4 grid gap-3">
          <p className="break-all font-mono text-xs">{confirmUrl}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a className="inline-flex" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
              <Button type="button">WhatsApp</Button>
            </a>
            <a className="inline-flex" href={`sms:?&body=${encodeURIComponent(message)}`}>
              <Button type="button" variant="secondary">
                SMS
              </Button>
            </a>
          </div>
        </div>
      ) : null}
      {practicalTestApplies(listing.skillId, listing.skillName) ? (
        <div className="mt-6">
          <h3 className="font-display text-xl">Practical test</h3>
          <p className="mt-2 text-sm text-muted">
            Upload a photo of one task. A trainer opens the link and marks it passed or not yet.
          </p>
          <label className="mt-3 block text-sm">
            <input
              type="file"
              accept="image/*"
              disabled={busy !== ""}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void submitTest(file);
              }}
            />
          </label>
          {testUrl ? <p className="mt-3 break-all font-mono text-xs">{testUrl}</p> : null}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4">
          <Note>{error}</Note>
        </div>
      ) : null}
    </section>
  );
}
