import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { Button, Note, Skeleton } from "@/components/ui";
import { confirmJob, readJobConfirm } from "@/lib/trust-api";

export const Route = createFileRoute("/confirm/$token")({ component: ConfirmPage });

function ConfirmPage() {
  const { token } = Route.useParams();
  const [job, setJob] = useState<{ confirmed: boolean; name: string; skill: string; town: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancel = false;
    readJobConfirm({ data: { token } })
      .then((result) => {
        if (cancel) return;
        if (!result.ok) setError(result.error);
        else setJob(result.data);
      })
      .catch(() => {
        if (!cancel) setError("Could not open this confirmation.");
      });
    return () => {
      cancel = true;
    };
  }, [token]);

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const result = await confirmJob({ data: { token } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setJob((current) => (current ? { ...current, confirmed: true } : current));
    } catch {
      setError("Could not confirm this job.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <h1 className="font-display text-title">Confirm this job</h1>
      {!job && !error ? <Skeleton className="mt-6 h-40" /> : null}
      {job ? (
        <div className="mt-6 max-w-lg rounded-card border border-line bg-paper p-5">
          <p className="text-sm text-muted">
            {job.skill} · {job.town}
          </p>
          <p className="mt-2 font-display text-3xl">{job.name}</p>
          {job.confirmed ? (
            <p className="mt-4 text-sm font-medium">Confirmed by client.</p>
          ) : (
            <Button className="mt-5" onClick={() => void confirm()} disabled={busy}>
              {busy ? "Saving…" : "This job happened"}
            </Button>
          )}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4">
          <Note>{error}</Note>
        </div>
      ) : null}
    </Shell>
  );
}
