import { Link } from "@tanstack/react-router";
import { opensLabel, placeLine, yearsLabel, type PublicListing } from "@/lib/directory";

export function ListingCard({ listing }: { listing: PublicListing }) {
  return (
    <Link
      to="/p/$tapId"
      params={{ tapId: listing.id }}
      className="block rounded-card border border-line bg-paper p-4 transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <img
        src={listing.photo}
        alt={`${listing.displayName}'s work as a ${listing.skillName.toLowerCase()}`}
        loading="lazy"
        decoding="async"
        className="aspect-work w-full rounded-control object-cover"
      />
      <div className="px-1 pb-1 pt-4">
        <p className="font-mono text-xs tracking-wide text-muted">{listing.id}</p>
        <h3 className="mt-1 font-display text-2xl leading-tight">{listing.displayName}</h3>
        <p className="mt-1 text-sm">
          {listing.skillName} · {yearsLabel(listing.years)}
        </p>
        <p className="mt-1 text-sm text-muted">{placeLine(listing)}</p>
        <p className="mt-2 text-xs text-muted">{opensLabel(listing.views)}</p>
        {listing.sample ? (
          <p className="mt-3 inline-flex rounded-control border border-line px-2 py-1 text-xs font-medium text-muted">
            Sample profile
          </p>
        ) : null}
      </div>
    </Link>
  );
}
