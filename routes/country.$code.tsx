import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Disclaimer } from "@/components/disclaimer";
import { ListingCard } from "@/components/listing-card";
import { Shell } from "@/components/shell";
import { Note, Skeleton } from "@/components/ui";
import type { PublicListing } from "@/lib/directory";
import { countryBoard } from "@/lib/listings-api";
import { saveHomeCountry } from "@/lib/home-country";
import { COUNTRIES } from "@/lib/places";

export const Route = createFileRoute("/country/$code")({ component: CountryPage });

function CountryPage() {
  const { code } = Route.useParams();
  const country = COUNTRIES.find((item) => item.code === code.toUpperCase()) ?? null;
  const [skill, setSkill] = useState("");
  const [listings, setListings] = useState<PublicListing[] | null>(null);
  const [skills, setSkills] = useState<{ id: string; name: string; count: number }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setSkill("");
    if (country) saveHomeCountry(country.code);
  }, [country]);

  useEffect(() => {
    if (!country) return;
    let cancel = false;
    setListings(null);
    countryBoard({ data: { country: country.code, skill } })
      .then((result) => {
        if (cancel) return;
        if (!result.ok) {
          setError(result.error);
          setListings([]);
          return;
        }
        setError("");
        setListings(result.data.listings);
        setSkills(result.data.skills);
      })
      .catch(() => {
        if (!cancel) {
          setError("Could not open this country.");
          setListings([]);
        }
      });
    return () => {
      cancel = true;
    };
  }, [country, skill]);

  if (!country) {
    return (
      <Shell>
        <h1 className="font-display text-title">That country is not on Talent Finder.</h1>
        <Link to="/countries" className="mt-6 inline-flex text-sm font-semibold text-accent">
          All countries
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="text-sm text-muted">
        <Link to="/countries" className="font-semibold text-accent">
          All countries
        </Link>
      </p>
      <h1 className="mt-3 font-display text-title">{country.name}</h1>
      <p className="mt-3 max-w-2xl text-muted">
        People here are live after a one-time fee of {country.feeLabel}. The most opened ID is first. Sample profiles
        stay behind real ones.
      </p>
      {skills.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSkill("")}
            className={`rounded-control border px-3 py-2 text-sm ${skill === "" ? "border-ink bg-ink text-paper" : "border-line bg-paper"}`}
          >
            All skills
          </button>
          {skills.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSkill(item.id)}
              className={`rounded-control border px-3 py-2 text-sm ${skill === item.id ? "border-ink bg-ink text-paper" : "border-line bg-paper"}`}
            >
              {item.name}
              <span className="ml-2 font-mono text-xs opacity-70">{item.count}</span>
            </button>
          ))}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4">
          <Note>{error}</Note>
        </div>
      ) : null}
      {listings === null ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : listings.length === 0 ? (
        <p className="mt-6 text-muted">No one is live for that skill in {country.name} yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
      <div className="mt-10">
        <Disclaimer compact />
      </div>
    </Shell>
  );
}
