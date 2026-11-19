import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { SignInPanel } from "@/components/sign-in-panel";
import { diagnosticsReport, type DiagnosticCheck } from "@/lib/diagnostics-api";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/diagnostics")({ component: DiagnosticsPage });

type Row = DiagnosticCheck;

function DiagnosticsPage() {
  const { user, isPending } = useCurrentUserState();
  const [rows, setRows] = useState<Row[]>([]);
  const [version, setVersion] = useState("");

  useEffect(() => {
    if (!user) return;
    const client: Row[] = [];
    const https = window.location.protocol === "https:";
    client.push({
      id: "https",
      pass: https,
      advice: https ? "This page is on HTTPS." : "This preview is HTTP. A public launch must use HTTPS or the phone will not install the app.",
    });
    client.push({
      id: "service-worker",
      pass: "serviceWorker" in navigator,
      advice: "serviceWorker" in navigator ? "This browser can install a service worker." : "This browser cannot install a service worker.",
    });
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    client.push({
      id: "install",
      pass: standalone,
      advice: standalone ? "The app is running as an installed app." : "The app is open in a browser tab. Install is not proven.",
    });
    client.push({
      id: "camera",
      pass: Boolean(navigator.mediaDevices?.getUserMedia),
      advice: "The browser can ask for a camera. Talent Finder does not open the camera itself yet.",
    });
    client.push({
      id: "files",
      pass: typeof document.createElement("input").files !== "undefined",
      advice: "The file picker is available.",
    });
    const canvas = document.createElement("canvas");
    client.push({
      id: "compression",
      pass: Boolean(canvas.getContext("2d")),
      advice: "This browser can compress a photo on the device.",
    });
    client.push({
      id: "notifications",
      pass: "Notification" in window && Notification.permission === "granted",
      advice:
        "Notification" in window
          ? `Notification permission is ${Notification.permission}. Talent Finder does not send notifications yet.`
          : "This browser has no notification API.",
    });
    setRows(client);
    void diagnosticsReport().then((result) => {
      if (!result.ok) return;
      setVersion(result.data.version);
      setRows((current) => [...current, ...result.data.checks]);
    });
    void fetch("/__grok/manifest.webmanifest")
      .then((response) => response.json())
      .then((body: { name?: string }) => {
        const named = body.name === "Talent Finder";
        setRows((current) => [
          ...current,
          {
            id: "manifest",
            pass: named,
            advice: named ? "The install name is Talent Finder." : `The install name is "${body.name ?? "missing"}", not Talent Finder.`,
          },
        ]);
      })
      .catch(() => {
        setRows((current) => [...current, { id: "manifest", pass: false, advice: "The install manifest did not load." }]);
      });
  }, [user]);

  if (isPending) return <Shell><p className="text-sm text-muted">Checking the session…</p></Shell>;
  if (!user) {
    return (
      <Shell>
        <SignInPanel title="Sign in to open diagnostics" callbackURL="/diagnostics" />
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-display text-title">Diagnostics</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Hidden from the menu. Version {version || "…"}. A fail is advice, not a guess.
      </p>
      <ul className="mt-6 grid max-w-2xl gap-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-control border border-line bg-paper px-3 py-3 text-sm">
            <p className="font-semibold">{row.pass ? "Pass" : "Fail"} · {row.id}</p>
            <p className="mt-1 text-muted">{row.advice}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <Link to="/activation" className="font-semibold text-accent">
          Activation register
        </Link>
      </p>
    </Shell>
  );
}
