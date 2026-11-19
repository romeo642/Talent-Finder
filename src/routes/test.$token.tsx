import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { Button, Note, Skeleton } from "@/components/ui";
import { readPracticalTest, reviewPracticalTest } from "@/lib/trust-api";

export const Route = createFileRoute("/test/$token")({ component: TestPage });

function TestPage() {
  const { token } = Route.useParams();
  const [task, setTask] = useState<{ status: string; skill: string; name: string; photo: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancel = false;
    readPracticalTest({ data: { token } })
      .then((result) => {
        if (cancel) return;
        if (!result.ok) setError(result.error);
        else setTask(result.data);
      })
      .catch(() => {
        if (!cancel) setError("Could not open this test.");
      });
    return () => {
      cancel = true;
    };
  }, [token]);

  async function review(pass: boolean) {
    setBusy(true);
    setError("");
    try {
      const result = await reviewPracticalTest({ data: { token, pass } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTask((current) => (current ? { ...current, status: pass ? "passed" : "failed" } : current));
    } catch {
      setError("Could not save the review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <h1 className="font-display text-title">Practical test</h1>
      {!task && !error ? <Skeleton className="mt-6 h-64" /> : null}
      {task ? (
        <div className="mt-6 max-w-lg">
          <img src={task.photo} alt="" className="aspect-work w-full rounded-card object-cover" />
          <p className="mt-4 font-display text-3xl">{task.name}</p>
          <p className="mt-1 text-muted">{task.skill}</p>
          {task.status === "pending" ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => void review(true)} disabled={busy}>
                Pass
              </Button>
              <Button variant="secondary" onClick={() => void review(false)} disabled={busy}>
                Not yet
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm font-medium">{task.status === "passed" ? "Passed" : "Not passed yet"}</p>
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
