import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { SignInPanel } from "@/components/sign-in-panel";
import { Thread } from "@/components/thread";
import { Button } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { decideHire, myHireRequests, mySentRequests } from "@/lib/hire-api";

export const Route = createFileRoute("/inbox")({ component: InboxPage });

function InboxPage() {
  const { user, isPending } = useCurrentUserState();
  const [incoming, setIncoming] = useState<{ id: string; note: string; status: string; seeker_name: string }[]>([]);
  const [sent, setSent] = useState<{ id: string; listing_id: string; note: string; status: string; skill_name: string }[]>([]);
  const [openId, setOpenId] = useState("");

  function load() {
    void myHireRequests().then((result) => {
      if (result.ok) setIncoming(result.data);
    });
    void mySentRequests().then((result) => {
      if (result.ok) setSent(result.data);
    });
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (isPending) return <Shell><p className="text-sm text-muted">Checking the session…</p></Shell>;
  if (!user) {
    return (
      <Shell>
        <SignInPanel title="Sign in to see requests" callbackURL="/inbox" />
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-display text-title">Requests</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">Phone and email stay hidden until you accept. Messages open after that.</p>
      <section className="mt-8">
        <h2 className="font-display text-2xl">Waiting on you</h2>
        {incoming.filter((row) => row.status === "pending").length === 0 ? <p className="mt-3 text-sm text-muted">None waiting.</p> : null}
        <ul className="mt-3 grid gap-3">
          {incoming.filter((row) => row.status === "pending").map((row) => (
            <li key={row.id} className="rounded-card border border-line bg-paper p-4 text-sm">
              <p className="font-medium">{row.seeker_name}</p>
              <p className="mt-1 text-muted">{row.note}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Button onClick={() => void decideHire({ data: { id: row.id, accept: true, revealPhone: false } }).then(load)}>Accept email</Button>
                <Button variant="secondary" onClick={() => void decideHire({ data: { id: row.id, accept: true, revealPhone: true } }).then(load)}>Email and phone</Button>
                <Button variant="ghost" onClick={() => void decideHire({ data: { id: row.id, accept: false } }).then(load)}>Decline</Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="font-display text-2xl">Requests you sent</h2>
        {sent.length === 0 ? <p className="mt-3 text-sm text-muted">You have not sent a request.</p> : null}
        <ul className="mt-3 grid gap-3">
          {sent.map((row) => (
            <li key={row.id} className="rounded-card border border-line bg-paper p-4 text-sm">
              <p className="font-medium">{row.skill_name}</p>
              <p className="mt-1 text-muted">{row.status} · {row.note}</p>
              <Link to="/p/$tapId" params={{ tapId: row.listing_id }} className="mt-2 inline-flex text-sm font-semibold text-accent">
                Open ID
              </Link>
              {row.status === "accepted" ? (
                <button type="button" className="ml-4 text-sm font-semibold text-accent" onClick={() => setOpenId(row.id)}>
                  Messages
                </button>
              ) : null}
              {openId === row.id ? <div className="mt-3"><Thread requestId={row.id} /></div> : null}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="font-display text-2xl">Accepted on your profile</h2>
        <ul className="mt-3 grid gap-3">
          {incoming.filter((row) => row.status === "accepted").map((row) => (
            <li key={row.id} className="rounded-card border border-line bg-paper p-4">
              <button type="button" className="text-sm font-semibold text-accent" onClick={() => setOpenId(row.id)}>
                Messages with {row.seeker_name}
              </button>
              {openId === row.id ? <div className="mt-3"><Thread requestId={row.id} /></div> : null}
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}
