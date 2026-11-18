import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { POLICIES, currentPolicy } from "@/lib/privacy";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [version, setVersion] = useState(currentPolicy("en").version);
  const pack = POLICIES[language];
  const policy = pack.find((item) => item.version === version) ?? currentPolicy(language);

  return (
    <Shell>
      <article className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            Version {policy.version} · {policy.date}
          </p>
          <select
            className="rounded-control border border-line bg-paper px-2 py-1 text-sm"
            value={language}
            aria-label="Language"
            onChange={(event) => {
              const next = event.target.value === "fr" ? "fr" : "en";
              setLanguage(next);
              setVersion(currentPolicy(next).version);
            }}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
        <h1 className="mt-2 font-display text-title">{policy.title}</h1>
        <section className="mt-4 rounded-card border border-line bg-paper p-5 text-sm leading-relaxed">
          <h2 className="font-display text-2xl">{policy.summaryTitle}</h2>
          {policy.summary.map((line) => (
            <p key={line} className="mt-2">
              {line}
            </p>
          ))}
        </section>
        <div className="mt-6 grid gap-6 text-sm leading-relaxed">
          {policy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-2xl">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-2">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
        <section className="mt-8">
          <h2 className="font-display text-2xl">{language === "fr" ? "Anciennes versions" : "Older versions"}</h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {pack.map((item) => (
              <li key={item.version}>
                <button type="button" className="font-semibold text-accent" onClick={() => setVersion(item.version)}>
                  {item.version} · {item.date}
                  {item.version === currentPolicy(language).version
                    ? language === "fr"
                      ? " · version en vigueur"
                      : " · current"
                    : ""}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </Shell>
  );
}
