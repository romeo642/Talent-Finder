import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListingCard } from "@/components/listing-card";
import { Shell } from "@/components/shell";
import { Button, controlClass, Note } from "@/components/ui";
import type { PublicListing } from "@/lib/directory";
import { readHomeCountry, saveHomeCountry } from "@/lib/home-country";
import { searchListings } from "@/lib/listings-api";
import { COUNTRIES } from "@/lib/places";
import { SKILL_GROUPS } from "@/lib/skills";

export const Route = createFileRoute("/match")({ component: MatchPage });

function MatchPage() {
  const [country, setCountry] = useState("");
  const [skill, setSkill] = useState("");
  const [town, setTown] = useState("");
  const [listings, setListings] = useState<PublicListing[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setCountry(readHomeCountry());
  }, []);

  const countryRow = COUNTRIES.find((item) => item.code === country) ?? null;
  const towns = countryRow?.regions.flatMap((region) => region.towns) ?? [];

  function search() {
    if (!country || !skill) {
      setError("Choose a country and a skill. Matches are people who listed that work.");
      return;
    }
    saveHomeCountry(country);
    setError("");
    setListings(null);
    const townRow = towns.find((item) => item.code === town);
    void searchListings({
      data: { country, skill, town: townRow?.code, q: townRow ? undefined : undefined, limit: 24 },
    }).then((result) => {
      if (!result.ok) {
        setError(result.error);
        setListings([]);
        return;
      }
      setListings(result.data.listings);
    });
  }

  return (
    <Shell>
      <h1 className="font-display text-title">Match a skill</h1>
      <p className="mt-3 max-w-2xl text-muted">
        This lists real people who published that skill in the country you chose. It does not invent a match.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <select
          className={controlClass}
          value={country}
          onChange={(event) => {
            setCountry(event.target.value);
            setTown("");
            setListings(null);
          }}
        >
          <option value="">Country</option>
          {COUNTRIES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
        <select className={controlClass} value={skill} onChange={(event) => setSkill(event.target.value)}>
          <option value="">Skill</option>
          {SKILL_GROUPS.flatMap((group) => group.skills).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select className={controlClass} value={town} onChange={(event) => setTown(event.target.value)} disabled={!countryRow}>
          <option value="">Any town</option>
          {towns.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
        <Button onClick={search}>Show people</Button>
      </div>
      {error ? (
        <div className="mt-4">
          <Note>{error}</Note>
        </div>
      ) : null}
      {listings && listings.length === 0 ? <p className="mt-6 text-muted">No one has listed this skill here yet.</p> : null}
      {listings && listings.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : null}
    </Shell>
  );
}
