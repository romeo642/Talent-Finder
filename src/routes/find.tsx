import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Disclaimer } from "@/components/disclaimer";
import { ListingCard } from "@/components/listing-card";
import { Shell } from "@/components/shell";
import { Button, controlClass, Note, Skeleton } from "@/components/ui";
import type { PublicListing } from "@/lib/directory";
import { searchListings } from "@/lib/listings-api";
import { COUNTRIES } from "@/lib/places";
import { readHomeCountry, saveHomeCountry } from "@/lib/home-country";
import { SKILL_GROUPS } from "@/lib/skills";

type FindSearch = { q?: string };

export const Route = createFileRoute("/find")({
  validateSearch: (search: Record<string, unknown>): FindSearch => {
    const q = typeof search.q === "string" ? search.q.slice(0, 80) : "";
    return q ? { q } : {};
  },
  component: FindPage,
});

function FindPage() {
  const initial = Route.useSearch();
  const [q, setQ] = useState(initial.q ?? "");
  const [query, setQuery] = useState((initial.q ?? "").trim());
  const [country, setCountry] = useState("");
  const [countryReady, setCountryReady] = useState(false);
  const [region, setRegion] = useState("");
  const [town, setTown] = useState("");
  const [skill, setSkill] = useState("");
  const [listings, setListings] = useState<PublicListing[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  const countryRow = COUNTRIES.find((item) => item.code === country) ?? null;
  const regionRow = countryRow?.regions.find((item) => item.code === region) ?? null;

  useEffect(() => {
    setQ(initial.q ?? "");
    setQuery((initial.q ?? "").trim());
  }, [initial.q]);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(q.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const saved = readHomeCountry();
    if (saved) setCountry(saved);
    setCountryReady(true);
  }, []);

  useEffect(() => {
    if (!countryReady) return;
    let cancel = false;
    if (!country) {
      setListings([]);
      setTotal(0);
      return;
    }
    setListings(null);
    searchListings({ data: { q: query, country, region, town, skill, limit: 12, offset: 0 } })
      .then((result) => {
        if (cancel) return;
        if (!result.ok) {
          setError(result.error);
          setListings([]);
          return;
        }
        setError("");
        setListings(result.data.listings);
        setTotal(result.data.total);
      })
      .catch(() => {
        if (!cancel) {
          setError("Could not load the directory.");
          setListings([]);
        }
      });
    return () => {
      cancel = true;
    };
  }, [query, country, region, town, skill, countryReady]);

  function showMore() {
    if (!listings || loadingMore || !country) return;
    setLoadingMore(true);
    searchListings({
      data: { q: query, country, region, town, skill, limit: 12, offset: listings.length },
    })
      .then((result) => {
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setListings((current) => [...(current ?? []), ...result.data.listings]);
        setTotal(result.data.total);
      })
      .catch(() => setError("Could not load more people."))
      .finally(() => setLoadingMore(false));
  }

  return (
    <Shell>
      <h1 className="font-display text-title">Find a skilled hand</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Filter by place and skill, or paste a Talent Finder ID. Sample profiles are marked and are not real people.
      </p>

      <form
        className="mt-6 grid gap-3 rounded-card border border-line bg-paper p-4 sm:grid-cols-2"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="block sm:col-span-2">
          <span className="mb-2 block text-sm font-medium">Search</span>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Name, town, skill, or Talent Finder ID"
            className={controlClass}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Country</span>
          <select
            className={controlClass}
            value={country}
            onChange={(event) => {
              setCountry(event.target.value);
              if (event.target.value) saveHomeCountry(event.target.value);
              setRegion("");
              setTown("");
            }}
          >
            <option value="">Choose a country</option>
            {COUNTRIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Region</span>
          <select
            className={controlClass}
            value={region}
            disabled={!countryRow}
            onChange={(event) => {
              setRegion(event.target.value);
              setTown("");
            }}
          >
            <option value="">Any region</option>
            {countryRow?.regions.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Town</span>
          <select
            className={controlClass}
            value={town}
            disabled={!regionRow}
            onChange={(event) => setTown(event.target.value)}
          >
            <option value="">Any town</option>
            {regionRow?.towns.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Skill</span>
          <select className={controlClass} value={skill} onChange={(event) => setSkill(event.target.value)}>
            <option value="">All skills</option>
            {SKILL_GROUPS.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.skills.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2">
          <Button
            variant="ghost"
            onClick={() => {
              setQ("");
              setQuery("");
              setCountry("");
              setRegion("");
              setTown("");
              setSkill("");
            }}
          >
            Clear filters
          </Button>
        </div>
      </form>

      {error ? (
        <div className="mt-4">
          <Note>{error}</Note>
        </div>
      ) : null}

      <p className="mt-6 text-sm text-muted tabular-nums">
        {listings === null ? "Looking…" : `${total} ${total === 1 ? "person" : "people"}`}
      </p>

      {listings === null ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : listings.length === 0 ? (
        <p className="mt-4 text-muted">No one is listed for that search. Try a wider area, or list yourself.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {listings && listings.length < total ? (
        <div className="mt-6">
          <Button variant="secondary" onClick={showMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Show more"}
          </Button>
        </div>
      ) : null}

      <div className="mt-10">
        <Disclaimer compact />
      </div>
    </Shell>
  );
}
