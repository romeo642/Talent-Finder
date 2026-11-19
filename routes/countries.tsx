import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { COUNTRIES } from "@/lib/places";

export const Route = createFileRoute("/countries")({ component: CountriesPage });

function CountriesPage() {
  return (
    <Shell>
      <h1 className="font-display text-title">Live by country</h1>
      <p className="mt-3 max-w-2xl text-muted">
        A one-time fee publishes a person in their country. The ID that is opened most often appears first on that
        country's list of skills and talents.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {COUNTRIES.map((country) => (
          <li key={country.code}>
            <Link
              to="/country/$code"
              params={{ code: country.code }}
              className="flex items-center justify-between gap-4 rounded-card border border-line bg-paper px-5 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span>
                <span className="block font-medium">{country.name}</span>
                <span className="mt-1 block text-sm text-muted">One-time fee {country.feeLabel}</span>
              </span>
              <span className="font-mono text-xs">{country.code}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
