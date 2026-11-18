import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Disclaimer } from "@/components/disclaimer";
import { ListingCard } from "@/components/listing-card";
import { Shell } from "@/components/shell";
import { buttonClass, Skeleton } from "@/components/ui";
import { searchListings } from "@/lib/listings-api";
import { readHomeCountry } from "@/lib/home-country";
import { COUNTRIES } from "@/lib/places";
import type { PublicListing } from "@/lib/directory";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [listings, setListings] = useState<PublicListing[] | null>(null);
  const [home, setHome] = useState("");

  useEffect(() => {
    const page = window.location.origin + "/";
    const text = "Talent Finder finds a plumber, electrician, carpenter and other skilled hands near you. " + page;
    const whatsapp = document.getElementById("share-whatsapp");
    if (whatsapp) whatsapp.setAttribute("href", "https://wa.me/?text=" + encodeURIComponent(text));
    const facebook = document.getElementById("share-facebook");
    if (facebook) facebook.setAttribute("href", "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(page));
    const x = document.getElementById("share-x");
    if (x) x.setAttribute("href", "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text));
    const copy = document.getElementById("share-page");
    const onCopy = async () => {
      if (!copy) return;
      try {
        await navigator.clipboard.writeText(page);
        copy.textContent = "Link copied";
      } catch {
        copy.textContent = "Copy failed";
      }
    };
    copy?.addEventListener("click", onCopy);
    return () => copy?.removeEventListener("click", onCopy);
  }, []);

  useEffect(() => {
    let cancel = false;
    const code = readHomeCountry();
    setHome(code);
    if (!code) {
      setListings([]);
      return;
    }
    searchListings({ data: { limit: 6, country: code } })
      .then((result) => {
        if (cancel) return;
        setListings(result.ok ? result.data.listings.slice(0, 6) : []);
      })
      .catch(() => {
        if (!cancel) setListings([]);
      });
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <Shell>
      <section className="grid items-center gap-8 md:grid-cols-2">
        <div>
          <h1 className="sr-only">Talent Finder</h1>
          <img src="/logo.jpg?v=finder" alt="Talent Finder" className="h-auto w-full max-w-xs" />
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
            Talent Finder is how a home, a factory, or a company finds a skilled hand. Search a plumber, electrician,
            carpenter, welder, painter, gardener, tailor, cleaner, cook, or home tutor nearby. They show their best work,
            get an ID, and you open it.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              className={buttonClass("secondary")}
              href="https://wa.me/?text=Talent%20Finder%20finds%20a%20skilled%20hand%20near%20you."
              id="share-whatsapp"
            >
              Share on WhatsApp
            </a>
            <a className={buttonClass("secondary")} href="https://www.facebook.com/sharer/sharer.php" id="share-facebook">
              Share on Facebook
            </a>
            <a className={buttonClass("secondary")} href="https://twitter.com/intent/tweet" id="share-x">
              Share on X
            </a>
            <button type="button" className={buttonClass("secondary")} id="share-page">
              Copy link
            </button>
          </div>
          <ol className="panels mt-8 grid grid-cols-3 overflow-hidden rounded-card border border-ink">
            {[
              ["Place", "Town and community", "bg-paper text-ink"],
              ["Skill", "The work you do", "bg-accent text-accent-fg"],
              ["ID", "One code to open", "bg-ink text-paper"],
            ].map(([title, body, tone]) => (
              <li key={title} className={`px-3 py-4 ${tone}`}>
                <p className="font-display text-lg leading-none">{title}</p>
                <p className="mt-1 text-xs leading-snug opacity-80">{body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/login" search={{ mode: "up" }} className={buttonClass()}>
              Sign up
            </Link>
            <Link to="/list" className={buttonClass("secondary")}>
              List your work
            </Link>
            <Link to="/match" className={buttonClass("secondary")}>
              Match a skill
            </Link>
          </div>
        </div>
        <figure className="bracket relative md:pl-6 md:pt-6">
          <div className="absolute top-0 left-0 hidden h-[88%] w-[88%] rounded-card border border-ink md:block" aria-hidden="true" />
          <img
            src="/samples/painter.jpg"
            alt="A freshly painted room, the kind of work a Talent Finder listing shows"
            className="relative aspect-work w-full rounded-card object-cover"
          />
          <p className="absolute top-3 right-3 rounded-full border border-ink bg-paper px-3 py-1 font-mono text-xs tracking-widest md:top-9 md:right-3">
            Sample
          </p>
          <figcaption className="absolute inset-x-4 bottom-4 rounded-control border border-ink bg-paper p-4 md:inset-x-10">
            <p className="font-mono text-xs tracking-wide text-muted">GH-GA-ACC-OSU-0001</p>
            <p className="mt-1 font-display text-2xl leading-tight">Ama Mensah</p>
            <p className="mt-1 text-sm text-muted">Painter · 11 years · Osu, Accra</p>
            <p className="mt-2 text-xs font-medium text-faint">Sample listing</p>
          </figcaption>
        </figure>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {[
          ["Hands", "Skilled hands", "Gardeners, welders, cooks, drivers, technicians. You type the skill, show the work, and keep your own clients.", "bg-ink text-paper"],
          ["Door", "Homes", "A household finds someone nearby, checks the photo of the work, and calls or messages only if a contact was left on.", "border border-dashed border-ink bg-paper text-ink"],
          ["Works", "Factories and companies", "A workshop or a firm looks up a trade in a town and reaches a person with an ID they can check.", "bg-accent text-accent-fg"],
        ].map(([mark, title, body, tone]) => (
          <article key={title} data-mark={mark} className={`watermark rounded-card p-5 ${tone}`}>
            <h2 className="relative font-display text-2xl leading-tight">{title}</h2>
            <p className="relative mt-2 text-sm leading-relaxed opacity-80">{body}</p>
          </article>
        ))}
      </section>

      <div className="cut-rule" aria-hidden="true" />

      <section className="mt-16">
        <ol className="steps grid gap-4 sm:grid-cols-3">
          {[
            ["1", "Name your place", "Country, region, town, then the community you actually work in. That place becomes your ID."],
            ["2", "Show the skill", "Type the skill or pick one, add years, and upload a photo of your best job."],
            ["3", "Be found", "Homes, factories, and companies open the ID. Contact is optional: email, a social handle, or a phone."],
          ].map(([n, title, body]) => (
            <li key={n} className="page-fold rounded-card border border-line bg-paper p-5 pt-8">
              <h2 className="font-display text-2xl leading-tight">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-title">The listing fee, after you are on Talent Finder</h2>
        <p className="mt-3 max-w-2xl text-muted">
          The connection comes first. A small one-time fee publishes the ID in that country. The ID people open most
          often moves ahead of the others. Adults only. Talent Finder does not
          take a cut of the job. Paystack charges it in local currency, by mobile money, QR, transfer, or card.
        </p>
        <ul className="fees mt-6 divide-y divide-line rounded-card border border-line bg-paper">
          {COUNTRIES.map((country) => (
            <li key={country.code}>
              <Link
                to="/country/$code"
                params={{ code: country.code }}
                className="flex flex-col gap-3 px-5 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ink font-mono text-xs">
                    {country.code}
                  </span>
                  <div>
                    <p className="font-medium">{country.name}</p>
                    <p className="text-sm text-muted">{country.rails}</p>
                  </div>
                </div>
                <p className="fee-index font-mono text-sm tabular-nums sm:text-right">{country.feeLabel}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <div className="flex items-end gap-4">
          <h2 className="font-display text-title">People on Talent Finder</h2>
          <span className="mb-2 hidden h-px flex-1 bg-ink/25 sm:block" aria-hidden="true" />
          <Link to="/find" className="text-sm font-semibold text-accent">
            Browse all
          </Link>
        </div>
        {listings === null ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
            <Skeleton className="hidden h-72 lg:block" />
          </div>
        ) : listings.length === 0 ? (
          <p className="mt-6 text-muted">{home ? "No listings yet in this country." : "Choose a country to see who is listed there."}</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-16">
        <Disclaimer />
      </div>
    </Shell>
  );
}
