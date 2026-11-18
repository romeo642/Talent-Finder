import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui";
import { consentLines } from "@/lib/privacy";

export function ConsentDialog({
  country,
  busy,
  onAgree,
  onLater,
}: {
  country: string;
  busy: boolean;
  onAgree: (choice: { language: "en" | "fr"; boards: boolean; tips: boolean }) => void;
  onLater: () => void;
}) {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [publicOk, setPublicOk] = useState(false);
  const [ownWork, setOwnWork] = useState(false);
  const [adultOk, setAdultOk] = useState(false);
  const [boards, setBoards] = useState(false);
  const [tips, setTips] = useState(false);
  const copy = consentLines(language, country);

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-auto rounded-card border border-line bg-paper p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl">{copy.title}</h2>
          <select
            className="rounded-control border border-line bg-paper px-2 py-1 text-sm"
            value={language}
            onChange={(event) => setLanguage(event.target.value === "fr" ? "fr" : "en")}
            aria-label="Language"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>
        <ul className="mt-4 grid gap-2 text-sm leading-relaxed">
          {copy.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 text-sm">
          <Check checked={publicOk} onChange={setPublicOk} label={copy.publicOk} />
          <Check checked={ownWork} onChange={setOwnWork} label={copy.ownWork} />
          <Check checked={adultOk} onChange={setAdultOk} label={copy.adultOk} />
          <Check checked={boards} onChange={setBoards} label={copy.boards} />
          <Check checked={tips} onChange={setTips} label={copy.tips} />
        </div>
        <p className="mt-4 flex gap-4 text-sm">
          <Link to="/privacy" className="font-semibold text-accent">
            {copy.privacy}
          </Link>
          <Link to="/terms" className="font-semibold text-accent">
            {copy.terms}
          </Link>
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <Button disabled={busy || !publicOk || !ownWork || !adultOk} onClick={() => onAgree({ language, boards, tips })}>
            {copy.agree}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={onLater}>
            {copy.later}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3">
      <input type="checkbox" className="mt-1 size-5 accent-accent" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
