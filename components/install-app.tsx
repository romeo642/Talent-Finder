import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function browserKind() {
  const ua = navigator.userAgent;
  const iOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS) return "ios";
  if (/firefox/i.test(ua)) return "firefox";
  if (/edg\//i.test(ua)) return "edge";
  if (/opr\/|opera/i.test(ua)) return "opera";
  if (/samsungbrowser/i.test(ua)) return "samsung";
  if (/chrome|chromium|crios/i.test(ua)) return "chrome";
  if (/safari/i.test(ua)) return "safari";
  return "other";
}

const STEPS: Record<string, string> = {
  ios: "In Safari, tap Share, then Add to Home Screen.",
  safari: "In Safari on Mac, choose File, then Add to Dock.",
  firefox: "In Firefox, open the page menu and choose Install, or Add to Home screen on Android.",
  edge: "In Edge, open the menu and choose Apps, then Install this site as an app.",
  opera: "In Opera, open the menu and choose Install Talent Finder.",
  samsung: "In Samsung Internet, open the menu and choose Add page to, then Home screen.",
  chrome: "In Chrome, open the menu and choose Cast, save, and share, or Install Talent Finder.",
  other: "Open the browser menu and look for Install app or Add to Home screen.",
};

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [kind, setKind] = useState("other");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setInstalled(standalone);
    setKind(browserKind());
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* install still works from the browser menu */
      });
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        className="text-sm font-semibold text-accent"
        onClick={() => {
          if (prompt) {
            void prompt.prompt().then(() => setPrompt(null));
            return;
          }
          setOpen((value) => !value);
        }}
      >
        Add to this browser
      </button>
      {open ? (
        <div className="mt-2 rounded-control border border-line bg-paper p-3 text-sm leading-relaxed text-muted">
          <p>{STEPS[kind] ?? STEPS.other}</p>
          <p className="mt-2">
            Chrome, Edge, Opera, and Samsung Internet can install it as an app. Safari uses Add to Home Screen or Add to
            Dock. Firefox uses Install or Add to Home screen.
          </p>
          <Button className="mt-3" variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      ) : null}
    </div>
  );
}
