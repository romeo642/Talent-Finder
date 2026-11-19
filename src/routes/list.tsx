import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { QrMark } from "@/components/qr-mark";
import { SignInPanel } from "@/components/sign-in-panel";
import { Button, buttonClass, controlClass, Field, Note, Skeleton } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { DUE_DILIGENCE, yearsLabel, type PublicListing } from "@/lib/directory";
import { ConsentDialog } from "@/components/consent-dialog";
import { confirmPreview, getMine, getSignupContact, keepDraft, submitListing } from "@/lib/listings-api";
import { recordConsent } from "@/lib/privacy-api";
import { MIN_AGE, HIGH_RISK_SKILLS } from "@/lib/privacy";
import { confirmAge } from "@/lib/hire-api";
import { compressPhoto, prepareDocument } from "@/lib/photo";
import { COUNTRIES } from "@/lib/places";
import { methodById, methodsFor } from "@/lib/payments";
import { SKILL_GROUPS, SKILLS, skillById } from "@/lib/skills";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/list")({ component: ListPage });

type ContactChoice = "" | "phone" | "email" | "facebook" | "instagram" | "tiktok" | "twitter";

const CONTACT_CHOICES: { id: Exclude<ContactChoice, "">; label: string }[] = [
  { id: "phone", label: "Phone" },
  { id: "email", label: "Email" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "twitter", label: "X" },
];

type FormState = {
  countryCode: string;
  regionCode: string;
  townCode: string;
  communityCode: string;
  skillId: string;
  skillName: string;
  years: number;
  displayName: string;
  phone: string;
  email: string;
  facebook: string;
  instagram: string;
  twitter: string;
  tiktok: string;
  contactChoice: ContactChoice;
  contactValue: string;
  whatsappSame: boolean;
  reach: string;
  contactActive: boolean;
  payMethod: string;
  experience: string;
  photo: string;
  photoNote: string;
  photoMadeOn: string;
  photo2: string;
  photo2Note: string;
  photo2MadeOn: string;
  photo3: string;
  photo3Note: string;
  photo3MadeOn: string;
  showsPeople: boolean;
  hasPermission: boolean;
  proofNote: string;
  document: string;
  documentName: string;
  acceptDisclaimer: boolean;
};

const EMPTY: FormState = {
  countryCode: "GH",
  regionCode: "",
  townCode: "",
  communityCode: "",
  skillId: "",
  skillName: "",
  years: 3,
  displayName: "",
  phone: "",
  email: "",
  facebook: "",
  instagram: "",
  twitter: "",
  tiktok: "",
  contactChoice: "",
  contactValue: "",
  whatsappSame: true,
  reach: "",
  contactActive: true,
  payMethod: "mtn",
  experience: "",
  photo: "",
  photoNote: "",
  photoMadeOn: "",
  photo2: "",
  photo2Note: "",
  photo2MadeOn: "",
  photo3: "",
  photo3Note: "",
  photo3MadeOn: "",
  showsPeople: false,
  hasPermission: false,
  proofNote: "",
  document: "",
  documentName: "",
  acceptDisclaimer: false,
};

function chosenContact(listing: {
  phone?: string | null;
  email?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
}): { contactChoice: ContactChoice; contactValue: string } {
  if (listing.phone) return { contactChoice: "phone", contactValue: listing.phone };
  if (listing.email) return { contactChoice: "email", contactValue: listing.email };
  if (listing.facebook) return { contactChoice: "facebook", contactValue: listing.facebook };
  if (listing.instagram) return { contactChoice: "instagram", contactValue: listing.instagram };
  if (listing.tiktok) return { contactChoice: "tiktok", contactValue: listing.tiktok };
  if (listing.twitter) return { contactChoice: "twitter", contactValue: listing.twitter };
  return { contactChoice: "", contactValue: "" };
}

function packLive(form: FormState) {
  const socials = { facebook: "", instagram: "", twitter: "", tiktok: "" };
  const value = form.contactValue.trim().replace(/^@/, "");
  const phone = form.contactChoice === "phone" ? form.contactValue.trim() : "";
  const email = form.contactChoice === "email" ? form.contactValue.trim() : "";
  if (form.contactChoice === "facebook" || form.contactChoice === "instagram" || form.contactChoice === "tiktok" || form.contactChoice === "twitter") {
    socials[form.contactChoice] = value;
  }
  const contactActive = Boolean(phone || email || form.reach.trim() || Object.values(socials).some(Boolean));
  return {
    ...socials,
    phone,
    email,
    whatsappSame: form.contactChoice === "phone" && form.whatsappSame && Boolean(phone),
    contactActive,
  };
}

function fromListing(listing: PublicListing): FormState {
  return {
    countryCode: listing.countryCode,
    regionCode: listing.regionCode,
    townCode: listing.townCode,
    communityCode: listing.communityCode,
    skillId: listing.skillId,
    skillName: listing.skillName,
    years: listing.years,
    displayName: listing.displayName,
    phone: listing.phone ?? "",
    email: listing.email ?? "",
    facebook: listing.facebook ?? "",
    instagram: listing.instagram ?? "",
    twitter: listing.twitter ?? "",
    tiktok: listing.tiktok ?? "",
    ...chosenContact(listing),
    whatsappSame: Boolean(listing.whatsapp),
    reach: listing.reach ?? "",
    contactActive: listing.contactActive,
    payMethod: methodsFor(listing.countryCode)[0]?.id ?? "mtn",
    experience: listing.experience,
    photo: listing.photo,
    photoNote: "",
    photoMadeOn: "",
    photo2: "",
    photo2Note: "",
    photo2MadeOn: "",
    photo3: "",
    photo3Note: "",
    photo3MadeOn: "",
    showsPeople: false,
    hasPermission: false,
    proofNote: "",
    document: "",
    documentName: "",
    acceptDisclaimer: false,
  };
}

function ExtraWork({
  label,
  photo,
  note,
  madeOn,
  onPhoto,
  onNote,
  onDate,
  onError,
}: {
  label: string;
  photo: string;
  note: string;
  madeOn: string;
  onPhoto: (photo: string) => void;
  onNote: (note: string) => void;
  onDate: (date: string) => void;
  onError: (message: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded-control border border-line bg-paper p-4">
      <p className="text-sm font-semibold">{label}</p>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        capture="environment"
        className="block w-full text-sm file:mr-3 file:h-11 file:rounded-control file:border-0 file:bg-accent file:px-4 file:text-sm file:font-semibold file:text-accent-fg"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          void compressPhoto(file)
            .then(onPhoto)
            .catch((reason: unknown) => {
              onPhoto("");
              onError(reason instanceof Error ? reason.message : "Could not read that photo.");
            });
        }}
      />
      {photo ? <img src={photo} alt="" className="aspect-work w-full rounded-control object-cover" /> : null}
      <input
        value={note}
        maxLength={160}
        placeholder="Short note"
        onChange={(event) => onNote(event.target.value)}
        className="h-11 w-full rounded-control border border-line bg-paper px-3"
      />
      <input type="date" value={madeOn} onChange={(event) => onDate(event.target.value)} className="h-11 w-full rounded-control border border-line bg-paper px-3" />
    </div>
  );
}

function ListPage() {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id;
  const [existing, setExisting] = useState<PublicListing | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!userId) return;
    let cancel = false;
    getMine()
      .then((result) => {
        if (cancel) return;
        if (!result.ok) setLoadError(result.error);
        else setExisting(result.data);
        setReady(true);
      })
      .catch(() => {
        if (!cancel) {
          setLoadError("Could not load your listing.");
          setReady(true);
        }
      });
    return () => {
      cancel = true;
    };
  }, [userId]);

  if (isPending) {
    return (
      <Shell>
        <Skeleton className="h-80" />
      </Shell>
    );
  }
  if (!user) {
    return (
      <Shell>
        <SignInPanel />
      </Shell>
    );
  }
  if (!ready) {
    return (
      <Shell>
        <Skeleton className="h-80" />
      </Shell>
    );
  }

  return (
    <Shell>
      {loadError ? (
        <div className="mb-4">
          <Note>{loadError}</Note>
        </div>
      ) : null}
      <Wizard existing={existing} />
    </Shell>
  );
}

function Wizard({ existing }: { existing: PublicListing | null }) {
  const [fieldId, setFieldId] = useState("");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(existing ? fromListing(existing) : EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [checkout, setCheckout] = useState<{
    reference: string;
    feeLabel: string;
    payMethod: string;
    qr: boolean;
    url: string;
    live: boolean;
  } | null>(null);
  const [published, setPublished] = useState<PublicListing | null>(null);
  const [askConsent, setAskConsent] = useState(false);
  const [adult, setAdult] = useState<"unknown" | "yes" | "no">("unknown");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (existing) return;
    let cancel = false;
    getSignupContact()
      .then((result) => {
        if (cancel) return;
        let saved = { phone: "", facebook: "", instagram: "", tiktok: "" };
        try {
          const raw = window.sessionStorage.getItem("tf-signup-contact");
          if (raw) saved = { ...saved, ...JSON.parse(raw) };
          window.sessionStorage.removeItem("tf-signup-contact");
        } catch {
          /* ignore a bad stash */
        }
        if (result.ok && result.data) {
          saved = {
            phone: result.data.phone || saved.phone,
            facebook: result.data.facebook || saved.facebook,
            instagram: result.data.instagram || saved.instagram,
            tiktok: result.data.tiktok || saved.tiktok,
          };
        }
        if (!saved.phone && !saved.facebook && !saved.instagram && !saved.tiktok) return;
        const picked = chosenContact(saved);
        setForm((current) => ({
          ...current,
          ...(current.contactChoice ? {} : picked),
          facebook: current.facebook || saved.facebook,
          instagram: current.instagram || saved.instagram,
          tiktok: current.tiktok || saved.tiktok,
        }));
      })
      .catch(() => {
        /* contact can still be typed on the listing */
      });
    return () => {
      cancel = true;
    };
  }, [existing]);

  const country = COUNTRIES.find((item) => item.code === form.countryCode) ?? COUNTRIES[0];
  const region = country.regions.find((item) => item.code === form.regionCode) ?? null;
  const town = region?.towns.find((item) => item.code === form.townCode) ?? null;
  const community = town?.communities.find((item) => item.code === form.communityCode) ?? null;
  const skill = skillById(form.skillId);

  const groups = useMemo(() => {
    const q = form.skillName.trim().toLowerCase();
    return SKILL_GROUPS.filter((group) => !fieldId || group.id === fieldId)
      .map((group) => ({
        ...group,
        skills: group.skills.filter((item) => !q || item.name.toLowerCase().includes(q)),
      }))
      .filter((group) => group.skills.length > 0);
  }, [form.skillName, fieldId]);

  function patch(partial: Partial<FormState>) {
    setForm((current) => ({ ...current, ...partial }));
    setError("");
  }

  function next() {
    if (step === 0 && (!region || !town || !community)) {
      setError("Select your region, town, and community.");
      return;
    }
    if (step === 1 && form.skillName.trim().length < 2) {
      setError("Type your skill, or pick one from the list. You can change it later.");
      return;
    }
    if (step === 2) {
      if (!form.photo) {
        setError("Upload a photo of your best work.");
        return;
      }
      if (form.experience.trim().length < 40) {
        setError("Describe the work in at least 40 characters.");
        return;
      }
    }
    if (step === 3) {
      if (form.displayName.trim().length < 2) {
        setError("Enter the name clients should see.");
        return;
      }
      if (form.contactChoice && !form.contactValue.trim()) {
        setError("Enter that contact, or choose None.");
        return;
      }
    }
    setError("");
    setStep((value) => Math.min(4, value + 1));
  }

  async function publish() {
    if (!form.acceptDisclaimer) {
      setError("Confirm the due diligence notice before you continue.");
      return;
    }
    setBusy(existing ? "Saving your listing…" : "Checking your listing…");
    setError("");
    const result = await submitListing({
      data: {
        ...form,
        ...packLive(form),
        adult: true,
        origin: window.location.origin,
      },
    });
    setBusy("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.data.status === "published") {
      setUpdated(result.data.updated);
      setPublished(result.data.listing);
      return;
    }
    if (result.data.status === "paystack") {
      const url = result.data.authorizationUrl;
      if (result.data.qr) {
        setCheckout({
          reference: result.data.reference,
          feeLabel: result.data.feeLabel,
          payMethod: result.data.payMethod,
          qr: true,
          url,
          live: true,
        });
        return;
      }
      window.location.assign(url);
      return;
    }
    setCheckout({
      reference: result.data.reference,
      feeLabel: result.data.feeLabel,
      payMethod: result.data.payMethod,
      qr: result.data.qr,
      url: `${window.location.origin}/pay/callback?reference=${encodeURIComponent(result.data.reference)}&preview=1`,
      live: false,
    });
  }

  async function confirm() {
    if (!checkout) return;
    setBusy("Publishing your ID…");
    setError("");
    const result = await confirmPreview({ data: { reference: checkout.reference } });
    setBusy("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCheckout(null);
    setPublished(result.data);
  }

  if (adult === "unknown") {
    return (
      <section className="mx-auto max-w-lg rounded-card border border-line bg-paper p-6 sm:p-8">
        <p className="text-sm font-medium text-muted">Security check</p>
        <h1 className="mt-2 font-display text-title">Are you 18 or older?</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Talent Finder only publishes listings from adults. You cannot create an ID if you are under {MIN_AGE}.
        </p>
        {error ? (
          <div className="mt-4">
            <Note>{error}</Note>
          </div>
        ) : null}
        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={() => {
              void confirmAge().then((result) => {
                if (result.ok) setAdult("yes");
                else setError("Confirm your age while you are signed in, then try again.");
              });
            }}
          >
            Yes, I am 18 or older
          </Button>
          <Button variant="secondary" onClick={() => setAdult("no")}>
            No, I am under 18
          </Button>
        </div>
      </section>
    );
  }

  if (adult === "no") {
    return (
      <section className="mx-auto max-w-lg">
        <h1 className="font-display text-title">You can't create a Talent Finder ID yet</h1>
        <p className="mt-3 text-muted">This directory is limited to people who are 18 or older.</p>
        <Link to="/" className="mt-6 inline-flex text-sm font-semibold text-accent">
          Back home
        </Link>
      </section>
    );
  }

  if (published) {
    return (
      <section className="mx-auto max-w-lg rounded-card border border-line bg-paper p-6 sm:p-8">
        <p className="text-sm font-medium text-muted">{updated ? "Listing updated" : "ID issued"}</p>
        <h1 className="mt-2 font-display text-title">{published.displayName}</h1>
        <p className="mt-4 font-mono text-lg tracking-wide">{published.id}</p>
        <p className="mt-2 text-sm text-muted">
          {published.skillName} · {yearsLabel(published.years)}
        </p>
        {published.listed ? null : (
          <p className="mt-3 text-sm text-muted">Saved as a draft. It is not on public pages or boards.</p>
        )}
        <p className="mt-2 text-sm text-muted">
          Country, region, town, community, then your number. Share this ID with anyone hiring.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link to="/p/$tapId" params={{ tapId: published.id }} className={buttonClass("primary", true)}>
            Open your public page
          </Link>
          <Link to="/card" className={buttonClass("secondary", true)}>
            Go to my ID
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <p className="text-sm font-medium text-muted">
        {existing ? `Updating ${existing.id}` : "New listing"} · step {step + 1} of 5
      </p>
      <h1 className="mt-2 font-display text-title">
        {["Where you work", "Your skill", "Your best work", "Contact (optional)", "Review and pay"][step]}
      </h1>
      <div
        className="mt-4 h-1 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={step + 1}
        aria-label="Listing progress"
      >
        <div
          className="h-full w-full origin-left rounded-full bg-accent transition-transform duration-300 ease-out"
          style={{ transform: `scaleX(${(step + 1) / 5})` }}
        />
      </div>

      <div className="mt-6 rounded-card border border-line bg-paper p-4 sm:p-6">
        {step === 0 ? (
          <div className="grid gap-4">
            <Field label="Country" hint="Only countries where Paystack takes payments.">
              <select
                className={controlClass}
                value={form.countryCode}
                onChange={(event) =>
                  patch({
                    countryCode: event.target.value,
                    regionCode: "",
                    townCode: "",
                    communityCode: "",
                    payMethod: methodsFor(event.target.value)[0]?.id ?? "mtn",
                  })
                }
              >
                {COUNTRIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name} · {item.feeLabel}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Region">
              <select
                className={controlClass}
                value={form.regionCode}
                onChange={(event) => patch({ regionCode: event.target.value, townCode: "", communityCode: "" })}
              >
                <option value="">Select a region</option>
                {country.regions.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Town">
              <select
                className={controlClass}
                value={form.townCode}
                disabled={!region}
                onChange={(event) => patch({ townCode: event.target.value, communityCode: "" })}
              >
                <option value="">Select a town</option>
                {region?.towns.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Community" hint="This becomes part of your Talent Finder ID.">
              <select
                className={controlClass}
                value={form.communityCode}
                disabled={!town}
                onChange={(event) => patch({ communityCode: event.target.value })}
              >
                <option value="">Select a community</option>
                {town?.communities.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4">
            <Field label="Years of experience" hint={yearsLabel(form.years)}>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => patch({ years: Math.max(0, form.years - 1) })} aria-label="Fewer years">
                  −
                </Button>
                <span className="min-w-12 text-center font-mono text-3xl tabular-nums">{form.years}</span>
                <Button variant="secondary" onClick={() => patch({ years: Math.min(50, form.years + 1) })} aria-label="More years">
                  +
                </Button>
              </div>
            </Field>
            <Field label="Skill" hint="Choose a field, pick a title, or type a skill that is not listed. You can change it later without paying again.">
              <input
                value={form.skillName}
                onChange={(event) => {
                  const skillName = event.target.value;
                  const match = SKILLS.find((item) => item.name.toLowerCase() === skillName.trim().toLowerCase());
                  patch({ skillName, skillId: match?.id ?? "" });
                }}
                placeholder="Type a skill, such as Web designer"
                className={controlClass}
              />
            </Field>
            <Field label="Field" hint="Narrow the list, then choose the skill.">
              <select
                className={controlClass}
                value={fieldId}
                onChange={(event) => setFieldId(event.target.value)}
              >
                <option value="">All fields</option>
                {SKILL_GROUPS.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </select>
            </Field>
            {form.skillName.trim().length > 1 && !skill ? (
              <p className="text-sm text-muted">Using “{form.skillName.trim()}”. Pick a title below if it is already listed.</p>
            ) : null}
            <div className="max-h-80 overflow-auto rounded-control border border-line">
              {groups.map((group) => (
                <div key={group.id}>
                  <p className="sticky top-0 bg-bg px-3 py-2 text-xs font-medium text-muted">{group.label}</p>
                  {group.skills.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={form.skillId === item.id}
                      onClick={() => patch({ skillId: item.id, skillName: item.name })}
                      className={cn(
                        "flex h-11 w-full items-center px-3 text-left text-sm",
                        form.skillId === item.id ? "bg-accent text-accent-fg" : "hover:bg-bg",
                      )}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              ))}
              {groups.length === 0 ? (
                <p className="p-4 text-sm text-muted">No listed skill matches. The title you typed will be used, and you can update it later.</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4">
            <Field label="Photo of your best work" hint="Upload a real photo of the work itself. A painted wall, a finished haircut, a dress, a meal, a repair, or a garden. You do not have to be in the picture.">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                capture="environment"
                className="block w-full text-sm file:mr-3 file:h-11 file:rounded-control file:border-0 file:bg-accent file:px-4 file:text-sm file:font-semibold file:text-accent-fg"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setBusy("Preparing photo…");
                  void compressPhoto(file)
                    .then((photo) => {
                      patch({ photo });
                      setBusy("");
                    })
                    .catch((reason: unknown) => {
                      setBusy("");
                      setError(reason instanceof Error ? reason.message : "Could not read that photo.");
                    });
                }}
              />
            </Field>
            {form.photo ? (
              <img src={form.photo} alt="Your best work" className="aspect-work w-full rounded-control object-cover" />
            ) : null}
            <Field label="Note about this photo" hint="For example: Oil painting, 2026, commissioned by a school.">
              <input
                value={form.photoNote}
                maxLength={160}
                onChange={(event) => patch({ photoNote: event.target.value })}
                className="h-12 w-full rounded-control border border-line bg-paper px-4"
              />
            </Field>
            <Field label="Date the work was finished" hint="The Work checked badge needs three dated photos, no copies of someone else's picture, and a staff review, three vouches, or five hired answers.">
              <input
                type="date"
                value={form.photoMadeOn}
                onChange={(event) => patch({ photoMadeOn: event.target.value })}
                className="h-12 w-full rounded-control border border-line bg-paper px-4"
              />
            </Field>
            <ExtraWork
              label="Second photo of work"
              photo={form.photo2}
              note={form.photo2Note}
              madeOn={form.photo2MadeOn}
              onPhoto={(photo2) => patch({ photo2 })}
              onNote={(photo2Note) => patch({ photo2Note })}
              onDate={(photo2MadeOn) => patch({ photo2MadeOn })}
              onError={setError}
            />
            <ExtraWork
              label="Third photo of work"
              photo={form.photo3}
              note={form.photo3Note}
              madeOn={form.photo3MadeOn}
              onPhoto={(photo3) => patch({ photo3 })}
              onNote={(photo3Note) => patch({ photo3Note })}
              onDate={(photo3MadeOn) => patch({ photo3MadeOn })}
              onError={setError}
            />
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-5 accent-accent"
                checked={form.showsPeople}
                onChange={(event) => patch({ showsPeople: event.target.checked, hasPermission: false })}
              />
              <span>This photo shows a face, a child, a customer, or a private home.</span>
            </label>
            {form.showsPeople ? (
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 size-5 accent-accent"
                  checked={form.hasPermission}
                  onChange={(event) => patch({ hasPermission: event.target.checked })}
                />
                <span>I have permission to show them. If not, use a photo of the work only.</span>
              </label>
            ) : null}
            <Field label="Another photo of the work" hint="Optional. A second real photo of a finished job. JPG, PNG, or WEBP.">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                capture="environment"
                className="block w-full text-sm file:mr-3 file:h-11 file:rounded-control file:border-0 file:bg-accent file:px-4 file:text-sm file:font-semibold file:text-accent-fg"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setBusy("Preparing photo…");
                  void compressPhoto(file)
                    .then((photo) => {
                      patch({ document: photo, documentName: "best-work.jpg" });
                      setBusy("");
                    })
                    .catch((reason: unknown) => {
                      setBusy("");
                      setError(reason instanceof Error ? reason.message : "Could not read that document.");
                    });
                }}
              />
            </Field>
            {form.documentName ? <p className="text-sm text-muted">Ready: {form.documentName}</p> : null}
            {HIGH_RISK_SKILLS.includes(form.skillId) ? (
              <Field label="Extra proof, optional" hint="A finished job the customer allowed, a certificate, or a reference. This is marked Proof added. It is not required for other skills.">
                <input
                  value={form.proofNote}
                  maxLength={240}
                  onChange={(event) => patch({ proofNote: event.target.value })}
                  className="h-12 w-full rounded-control border border-line bg-paper px-4"
                />
              </Field>
            ) : null}
            <Field label="What you do" hint={`${form.experience.trim().length}/800`}>
              <textarea
                value={form.experience}
                maxLength={800}
                onChange={(event) => patch({ experience: event.target.value })}
                className="min-h-36 w-full rounded-control border border-line bg-paper p-4 text-base outline-none focus:border-accent"
                placeholder="The jobs you take, where you work, and what a client should expect."
              />
            </Field>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4">
            <p className="text-sm leading-relaxed text-muted">Contact is optional. Choose one.</p>
            <Field label="Name" hint="The name on your Talent Finder ID.">
              <input
                value={form.displayName}
                onChange={(event) => patch({ displayName: event.target.value })}
                className={controlClass}
                autoComplete="name"
              />
            </Field>
            <Field label="Contact" hint="One choice. Leave it on None if you do not want a contact on the ID.">
              <select
                value={form.contactChoice}
                onChange={(event) => patch({ contactChoice: event.target.value as ContactChoice, contactValue: "" })}
                className={controlClass}
              >
                <option value="">None</option>
                {CONTACT_CHOICES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            {form.contactChoice === "phone" ? (
              <Field label="Phone number" hint={`Optional. A ${country.name} number.`}>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 font-mono text-sm text-muted">+{country.dial}</span>
                  <input
                    value={form.contactValue}
                    onChange={(event) => patch({ contactValue: event.target.value })}
                    className={controlClass}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Local mobile number"
                  />
                </div>
              </Field>
            ) : null}
            {form.contactChoice === "phone" ? (
              <Switch
                checked={form.whatsappSame}
                label="WhatsApp is this phone"
                hint="Optional. Uses the phone number above."
                onChange={(whatsappSame) => patch({ whatsappSame })}
              />
            ) : null}
            {form.contactChoice === "email" ? (
              <Field label="Email" hint="Optional.">
                <input
                  value={form.contactValue}
                  onChange={(event) => patch({ contactValue: event.target.value })}
                  className={controlClass}
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@email.com"
                />
              </Field>
            ) : null}
            {form.contactChoice === "facebook" || form.contactChoice === "instagram" || form.contactChoice === "tiktok" || form.contactChoice === "twitter" ? (
              <Field label="Name on that network" hint="Your public @name.">
                <input
                  value={form.contactValue}
                  onChange={(event) => patch({ contactValue: event.target.value })}
                  className={controlClass}
                  autoComplete="off"
                  placeholder="@yourname"
                />
              </Field>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-4">
            {form.photo ? (
              <img src={form.photo} alt="" className="aspect-work w-full rounded-control object-cover" />
            ) : null}
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Place</dt>
                <dd>
                  {community?.name}, {town?.name}, {region?.name}, {country.name}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Skill</dt>
                <dd>
                  {form.skillName.trim() || skill?.name || "—"} · {yearsLabel(form.years)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Name</dt>
                <dd>{form.displayName || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Contact</dt>
                <dd>
                  {(() => {
                    const packed = packLive(form);
                    const social = CONTACT_CHOICES.find((item) => item.id === form.contactChoice);
                    if (!form.contactChoice || !form.contactValue.trim()) return "Not included";
                    if (form.contactChoice === "phone") return `Phone ${packed.phone}`;
                    if (form.contactChoice === "email") return packed.email;
                    return `${social?.label ?? "Contact"} @${form.contactValue.trim().replace(/^@/, "")}`;
                  })()}
                </dd>
              </div>
            </dl>
            <p className="text-sm leading-relaxed text-muted">{form.experience}</p>
            {existing ? (
              <p className="text-sm text-muted">
                No new fee. Your ID stays {existing.id}. Updating your place does not change the ID.
              </p>
            ) : (
              <div className="grid gap-3">
                <p className="text-sm">
                  One-time fee <span className="font-mono tabular-nums">{country.feeLabel}</span>. After it is paid, your ID
                  is live in {country.name}. The people opened most often appear first there. Paystack opens the method
                  you pick. Talent Finder never asks for a card number.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {methodsFor(country.code).map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      aria-pressed={form.payMethod === method.id}
                      onClick={() => patch({ payMethod: method.id })}
                      className={cn(
                        "rounded-control border px-3 py-3 text-left",
                        form.payMethod === method.id ? "border-accent bg-accent text-accent-fg" : "border-line bg-paper",
                      )}
                    >
                      <span className="block text-sm font-semibold">{method.label}</span>
                      <span className={cn("mt-1 block text-xs", form.payMethod === method.id ? "text-accent-fg" : "text-muted")}>
                        {method.detail}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="flex items-start gap-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                className="mt-1 size-5 accent-accent"
                checked={form.acceptDisclaimer}
                onChange={(event) => patch({ acceptDisclaimer: event.target.checked })}
              />
              <span>I am 18 or older, and I understand this: {DUE_DILIGENCE}</span>
            </label>
            {checkout ? (
              <div className="rounded-control border border-line bg-bg p-4">
                <p className="font-medium">
                  {methodById(country.code, checkout.payMethod)?.label ?? "Paystack"} · {checkout.feeLabel}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {checkout.live
                    ? "Scan the code or open Paystack to finish. Talent Finder does not collect the wallet PIN or the card."
                    : "This preview does not charge you. Scan the code on your phone, or confirm here. No card number is collected."}
                </p>
                <div className="mt-4">
                  <QrMark
                    text={checkout.url}
                    caption={checkout.qr ? "Paystack QR" : "Open this checkout"}
                  />
                </div>
                {checkout.live ? (
                  <a className={cn(buttonClass(), "mt-4")} href={checkout.url}>
                    Open Paystack
                  </a>
                ) : (
                  <Button className="mt-4" full disabled={Boolean(busy)} onClick={() => void confirm()}>
                    {busy || `Confirm ${checkout.feeLabel}`}
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4">
            <Note>{error}</Note>
          </div>
        ) : null}
        {busy && !checkout ? <p className="mt-4 text-sm text-muted">{busy}</p> : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button variant="ghost" disabled={step === 0 || Boolean(busy)} onClick={() => setStep((value) => value - 1)}>
            Back
          </Button>
          {step < 4 ? (
            <Button onClick={next}>Continue</Button>
          ) : checkout ? null : (
            <Button disabled={Boolean(busy)} onClick={() => setAskConsent(true)}>
              {busy || (existing ? "Publish my profile" : "Publish my profile")}
            </Button>
          )}
        </div>
      </div>
      {askConsent ? (
        <ConsentDialog
          country={country.name}
          busy={Boolean(busy)}
          onLater={() => {
            setAskConsent(false);
            setBusy("Saving your draft…");
            void keepDraft({
              data: { ...form, ...packLive(form), adult: true, origin: window.location.origin },
            })
              .then((result) => {
                setBusy("");
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setPublished(result.data);
              })
              .catch(() => {
                setBusy("");
                setError("Could not save the draft.");
              });
          }}
          onAgree={(choice) => {
            setBusy("Publishing your profile…");
            void recordConsent({
              data: {
                publicOk: true,
                ownWork: true,
                adultOk: true,
                boards: choice.boards,
                tips: choice.tips,
                language: choice.language,
                country: form.countryCode,
              },
            })
              .then(async (saved) => {
                if (!saved.ok) {
                  setBusy("");
                  setError(saved.error);
                  return;
                }
                setAskConsent(false);
                await publish();
              })
              .catch(() => {
                setBusy("");
                setError("Could not save your consent.");
              });
          }}
        />
      ) : null}
    </section>
  );
}

function Switch({
  checked,
  label,
  hint,
  onChange,
}: {
  checked: boolean;
  label: string;
  hint?: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-control border border-line px-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint ? <span className="mt-1 block text-sm text-muted">{hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full transition-colors duration-150",
          checked ? "bg-accent" : "bg-line-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-6 rounded-full bg-paper transition-transform duration-150",
            checked ? "translate-x-7" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}

