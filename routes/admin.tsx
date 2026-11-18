import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { SignInPanel } from "@/components/sign-in-panel";
import { Button, Note } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { adminTrustReport, logBreach, reviewQueue, decideReview, affectedUsers } from "@/lib/privacy-api";
import { adminOrders, refundOrder } from "@/lib/pay/orders";
import { adminAccounts, adminAdjustWallet, adminPaystackStatus, adminRemoveAccount, adminSavePaystack, adminVerifyAccount, adminWallets, assignRole, getPlanCatalog, savePlanOverrides } from "@/lib/admin-api";
import { adminShowReview, adminWorkReviews } from "@/lib/reviews-api";
import { staffGate, staffTotpBegin, staffTotpEnable, staffTotpVerify } from "@/lib/staff-gate";
import { moneyLabel } from "@/lib/pay/wallet";
import { PLAN_CONFIG } from "@/lib/plans";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type Report = {
  consents: { user_id: string; country: string; version: number; language: string }[];
  deletions: { user_id: string; status: string }[];
  reports: { listing_id: string; reason: string; note: string }[];
  breaches: { id: string; country: string; what: string; people: number; status: string }[];
};

function AdminPage() {
  const { user, isPending } = useCurrentUserState();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [what, setWhat] = useState("");
  const [orders, setOrders] = useState<{ reference: string; country: string; provider: string; status: string; amount: number; currency: string; kind: string }[]>([]);
  const [daily, setDaily] = useState<{ country: string; paid: number; revenue: number; failed: number }[]>([]);
  const [reference, setReference] = useState("");
  const [queue, setQueue] = useState<{ id: string; display_name: string; skill_name: string; review_status: string; flags: number }[]>([]);
  const [workReviews, setWorkReviews] = useState<{ id: string; listingId: string; authorName: string; stars: number; body: string; visible: boolean }[]>([]);
  const [affected, setAffected] = useState("");
  const [wallets, setWallets] = useState<{ user_id: string; currency: string; available: number; name: string }[]>([]);
  const [entries, setEntries] = useState<{ id: string; user_id: string; currency: string; amount: number; status: string; reference: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string; email: string; display_name: string | null; country_code: string | null; verified: boolean; removed: boolean; role: string }[]>([]);
  const [prices, setPrices] = useState<Record<string, { base: string; boost: string; hirer: string }>>({});
  const [walletUser, setWalletUser] = useState("");
  const [walletAmount, setWalletAmount] = useState("");
  const [walletCurrency, setWalletCurrency] = useState("GHS");
  const [note, setNote] = useState("");
  const [gate, setGate] = useState<"loading" | "setup" | "code" | "open" | "denied">("loading");
  const [setupSecret, setSetupSecret] = useState("");
  const [setupUri, setSetupUri] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [gateError, setGateError] = useState("");
  const [payPublic, setPayPublic] = useState("");
  const [paySecret, setPaySecret] = useState("");
  const [payOn, setPayOn] = useState(false);
  const [access, setAccess] = useState<"user" | "reviewer" | "admin" | "owner">("user");

  function load() {
    adminTrustReport()
      .then((result) => {
        if (!result.ok) return;
        setReport(result.data as Report);
      })
      .catch(() => setError("Could not load the trust report."));
  }

  function loadDesk() {
    void adminWallets().then((result) => {
      if (!result.ok) return;
      setWallets(result.data.balances);
      setEntries(result.data.entries);
    });
    void adminAccounts().then((result) => {
      if (result.ok) setAccounts(result.data);
    });
    void getPlanCatalog().then((result) => {
      if (!result.ok) return;
      const next: Record<string, { base: string; boost: string; hirer: string }> = {};
      for (const code of Object.keys(PLAN_CONFIG.bases)) {
        const base = result.data.overrides.bases?.[code] ?? PLAN_CONFIG.bases[code].major;
        const boost = result.data.overrides.boost?.[code] ?? PLAN_CONFIG.boost.majors[code];
        const hirer = result.data.overrides.hirer?.[code] ?? PLAN_CONFIG.hirer.majors[code];
        next[code] = { base: String(base), boost: String(boost), hirer: String(hirer) };
      }
      setPrices(next);
    });
  }

  useEffect(() => {
    if (!user) return;
    void staffGate().then((result) => {
      if (!result.ok) {
        setGateError(result.error);
        setGate("denied");
        return;
      }
      if (!result.data.enrolled) setGate("setup");
      else if (!result.data.passed) setGate("code");
      else setGate("open");
      setAccess(result.data.role);
    });
  }, [user]);

  useEffect(() => {
    if (gate !== "open") return;
    load();
    loadDesk();
    void adminPaystackStatus().then((result) => {
      if (result.ok) {
        setPayOn(result.data.configured);
        setPayPublic(result.data.publicKey);
      }
    });
  }, [gate]);

  if (isPending) return <Shell><p className="text-sm text-muted">Checking the session…</p></Shell>;
  if (!user) {
    return (
      <Shell>
        <SignInPanel title="Sign in to open staff tools" callbackURL="/admin" />
      </Shell>
    );
  }

  if (gate !== "open") {
    return (
      <Shell>
        <h1 className="font-display text-title">Admin code</h1>
        <p className="mt-3 max-w-lg text-sm text-muted">
          Only an admin or an owner registers this second code. A reviewer and a normal account cannot. Sign-in alone is not enough for admin tools. The code lasts 12 hours on this browser.
        </p>
        {gate === "denied" ? null : gate === "setup" ? (
          <div className="mt-6 grid max-w-lg gap-3">
            <Button
              onClick={() => {
                setGateError("");
                void staffTotpBegin().then((result) => {
                  if (!result.ok) setGateError(result.error);
                  else {
                    setSetupSecret(result.data.secret);
                    setSetupUri(result.data.uri);
                  }
                });
              }}
            >
              Register admin code
            </Button>
            {setupSecret ? (
              <>
                <p className="break-all rounded-control border border-line bg-paper p-3 font-mono text-sm">{setupSecret}</p>
                <p className="break-all text-xs text-muted">{setupUri}</p>
                <p className="text-sm">Add that key in your authenticator app, then enter the 6-digit code.</p>
              </>
            ) : null}
            <input
              value={adminCode}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              onChange={(event) => setAdminCode(event.target.value)}
              className="h-12 rounded-control border border-line bg-paper px-3"
              placeholder="6-digit code"
            />
            <Button
              onClick={() => {
                void staffTotpEnable({ data: { code: adminCode } }).then((result) => {
                  if (!result.ok) setGateError(result.error);
                  else setGate("open");
                });
              }}
            >
              Turn on the admin code
            </Button>
          </div>
        ) : (
          <form
            className="mt-6 grid max-w-lg gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void staffTotpVerify({ data: { code: adminCode } }).then((result) => {
                if (!result.ok) setGateError(result.error);
                else setGate("open");
              });
            }}
          >
            <input
              value={adminCode}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              onChange={(event) => setAdminCode(event.target.value)}
              className="h-12 rounded-control border border-line bg-paper px-3"
              placeholder="6-digit code"
            />
            <Button type="submit">Open admin</Button>
          </form>
        )}
        {gateError ? (
          <div className="mt-4 max-w-lg">
            <Note>{gateError}</Note>
          </div>
        ) : null}
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="font-display text-title">Admin</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Your role is {access}. A reviewer can check work and show reviews. An admin can change prices, payments, and accounts. Only an owner can change a role.
      </p>
      <p className="mt-2 text-sm">
        <Link to="/activation" className="font-semibold text-accent">
          Activation register
        </Link>
      </p>
      <section className="mt-6 max-w-2xl">
        <h2 className="font-display text-2xl">Paystack keys</h2>
        <p className="mt-2 text-sm text-muted">
          {payOn ? "A secret key is saved. Checkout will open Paystack." : "No secret key yet. Payments stay in preview until you paste a live or test secret key."} The secret is stored on the server and is not shown again.
        </p>
        <div className="mt-4 grid gap-3">
          <input value={payPublic} onChange={(event) => setPayPublic(event.target.value)} className="h-12 rounded-control border border-line bg-paper px-3" placeholder="Public key pk_test_ or pk_live_" />
          <input value={paySecret} onChange={(event) => setPaySecret(event.target.value)} type="password" className="h-12 rounded-control border border-line bg-paper px-3" placeholder="Secret key sk_test_ or sk_live_" autoComplete="off" />
          <Button
            onClick={() => {
              void adminSavePaystack({ data: { publicKey: payPublic, secretKey: paySecret } }).then((result) => {
                if (!result.ok) setError(result.error);
                else {
                  setPaySecret("");
                  setPayOn(true);
                }
              });
            }}
          >
            Save Paystack keys
          </Button>
        </div>
      </section>
      <section className="mt-6 max-w-2xl">
        <h2 className="font-display text-2xl">In-app wallet</h2>
        <p className="mt-2 text-sm text-muted">
          Balances are in the smallest currency unit. Paystack still settles card and mobile money. Staff can add or remove wallet money. Card numbers are not stored.
        </p>
        <ul className="mt-4 grid gap-2 text-sm">
          {wallets.length === 0 ? <li>No wallet balances yet.</li> : null}
          {wallets.map((row) => (
            <li key={`${row.user_id}-${row.currency}`}>
              {row.name} · {moneyLabel(row.currency, row.available)} · {row.user_id}
            </li>
          ))}
        </ul>
        <ul className="mt-3 grid gap-1 text-sm text-muted">
          {entries.map((row) => (
            <li key={row.id}>
              {row.reference} · {row.status} · {row.amount} {row.currency}
            </li>
          ))}
        </ul>
        <form
          className="mt-4 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const direction = (event.currentTarget.elements.namedItem("direction") as HTMLSelectElement).value;
            void adminAdjustWallet({
              data: { userId: walletUser, currency: walletCurrency, country: "GH", amount: Number(walletAmount), direction, note },
            }).then((result) => {
              if (!result.ok) setError(result.error);
              else loadDesk();
            });
          }}
        >
          <input value={walletUser} onChange={(event) => setWalletUser(event.target.value)} placeholder="Account id" className="h-11 rounded-control border border-line px-3" />
          <div className="flex gap-2">
            <input value={walletAmount} onChange={(event) => setWalletAmount(event.target.value)} placeholder="Amount" className="h-11 flex-1 rounded-control border border-line px-3" />
            <select value={walletCurrency} onChange={(event) => setWalletCurrency(event.target.value)} className="h-11 rounded-control border border-line px-3">
              {Object.values(PLAN_CONFIG.bases).map((item) => (
                <option key={item.currency}>{item.currency}</option>
              ))}
            </select>
            <select name="direction" className="h-11 rounded-control border border-line px-3">
              <option value="add">Add</option>
              <option value="remove">Remove</option>
            </select>
          </div>
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Reason" className="h-11 rounded-control border border-line px-3" />
          <Button type="submit">Update wallet</Button>
        </form>
      </section>
      <section className="mt-8 max-w-2xl">
        <h2 className="font-display text-2xl">Prices</h2>
        <p className="mt-2 text-sm text-muted">Yearly base price in local currency. Starter is 1×, Pro 2×, Plus 3×, Elite 4×. Boost and Hirer have their own prices.</p>
        <form
          className="mt-4 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const overrides = {
              bases: Object.fromEntries(Object.entries(prices).map(([code, row]) => [code, Number(row.base)])),
              boost: Object.fromEntries(Object.entries(prices).map(([code, row]) => [code, Number(row.boost)])),
              hirer: Object.fromEntries(Object.entries(prices).map(([code, row]) => [code, Number(row.hirer)])),
            };
            void savePlanOverrides({ data: { overrides } }).then((result) => {
              if (!result.ok) setError(result.error);
              else loadDesk();
            });
          }}
        >
          {Object.entries(prices).map(([code, row]) => (
            <div key={code} className="grid grid-cols-4 items-center gap-2 text-sm">
              <span>{code}</span>
              <input aria-label={`${code} base`} value={row.base} onChange={(event) => setPrices((current) => ({ ...current, [code]: { ...row, base: event.target.value } }))} className="h-10 rounded-control border border-line px-2" />
              <input aria-label={`${code} boost`} value={row.boost} onChange={(event) => setPrices((current) => ({ ...current, [code]: { ...row, boost: event.target.value } }))} className="h-10 rounded-control border border-line px-2" />
              <input aria-label={`${code} hirer`} value={row.hirer} onChange={(event) => setPrices((current) => ({ ...current, [code]: { ...row, hirer: event.target.value } }))} className="h-10 rounded-control border border-line px-2" />
            </div>
          ))}
          <Button type="submit">Save prices</Button>
        </form>
      </section>
      <section className="mt-8 max-w-2xl">
        <h2 className="font-display text-2xl">Accounts</h2>
        <p className="mt-2 text-sm text-muted">Verify marks an account as checked by staff. It is not a guarantee. Remove hides the profile, ends the session, and keeps payment records.</p>
        <ul className="mt-4 grid gap-3 text-sm">
          {accounts.map((account) => (
            <li key={account.id} className="rounded-control border border-line p-3">
              <p>
                {account.display_name || account.name} · {account.country_code || "—"} · {account.removed ? "Removed" : account.verified ? "Checked" : "Not checked"}
              </p>
              <p className="text-muted">{account.email} · {account.role || "user"}</p>
              {access === "owner" ? (
                <label className="mt-2 block text-sm">
                  Role
                  <select
                    className="mt-1 h-10 rounded-control border border-line bg-paper px-2"
                    value={account.role || "user"}
                    onChange={(event) => {
                      void assignRole({ data: { userId: account.id, role: event.target.value } }).then((result) => {
                        if (!result.ok) setError(result.error);
                        else loadDesk();
                      });
                    }}
                  >
                    <option value="user">User</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                </label>
              ) : null}
              <div className="mt-2 flex gap-3">
                <button type="button" className="font-semibold text-accent" onClick={() => void adminVerifyAccount({ data: { userId: account.id, verified: !account.verified } }).then(() => loadDesk())}>
                  {account.verified ? "Unverify" : "Verify"}
                </button>
                {account.removed ? null : (
                  <button type="button" className="font-semibold text-accent" onClick={() => void adminRemoveAccount({ data: { userId: account.id } }).then(() => loadDesk())}>
                    Remove account
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6 max-w-2xl">
        <h2 className="font-display text-2xl">Payments</h2>
        <p className="mt-2 text-sm text-muted">Amounts are stored in the smallest currency unit. Money is settled to the Paystack account. This app does not hold it.</p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void adminOrders({ data: { reference } }).then((result) => {
              if (!result.ok) return;
              setOrders(result.data.orders);
              setDaily(result.data.report);
            });
          }}
        >
          <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Reference" className="h-11 flex-1 rounded-control border border-line px-3" />
          <Button type="submit">Find</Button>
        </form>
        <ul className="mt-4 grid gap-2 text-sm">
          {daily.map((row) => (
            <li key={row.country}>
              {row.country}: {row.paid} paid, {row.revenue} minor units, {row.failed} failed
            </li>
          ))}
        </ul>
        <ul className="mt-4 grid gap-2 text-sm">
          {orders.map((order) => (
            <li key={order.reference} className="flex items-center justify-between gap-3">
              <span>
                {order.reference} · {order.country} · {order.provider} · {order.status} · {order.amount} {order.currency}
              </span>
              {order.status === "paid" || order.status === "success" ? (
                <button type="button" className="font-semibold text-accent" onClick={() => void refundOrder({ data: { reference: order.reference } }).then(() => setReference(order.reference))}>
                  Refund
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Consent records, deletion requests, open reports, and the breach log. Each view is recorded. Do not store card numbers or PINs.
      </p>
      {error ? (
        <div className="mt-4">
          <Note>{error}</Note>
        </div>
      ) : null}
      <section className="mt-6 grid gap-3">
        <h2 className="font-display text-2xl">Breach log</h2>
        <p className="text-sm text-muted">
          Stop and contain it, record what happened, tell the authority within 72 hours, tell affected people in their language, then fix the cause.
        </p>
        <input value={what} onChange={(event) => setWhat(event.target.value)} className="h-12 rounded-control border border-line px-3" placeholder="What was exposed" />
        <Button
          onClick={() => {
            void logBreach({ data: { country: "GH", what, people: 0 } }).then(() => {
              setWhat("");
              load();
            });
          }}
        >
          Record a breach
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            void affectedUsers({ data: { country: "GH" } }).then((result) => {
              if (result.ok) setAffected(result.data.map((row) => row.id).join(", ") || "No profiles in GH");
            });
          }}
        >
          List affected profiles in GH
        </Button>
        {affected ? <p className="text-sm">{affected}</p> : null}
        <ul className="grid gap-2 text-sm">
          {report?.breaches.map((row) => (
            <li key={row.id}>
              {row.country}: {row.what} · {row.people} people · {row.status}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-2xl">Review queue</h2>
        <Button
          className="mt-3"
          variant="secondary"
          onClick={() => {
            void reviewQueue().then((result) => {
              if (result.ok) setQueue(result.data);
            });
          }}
        >
          Load queue
        </Button>
        <ul className="mt-3 grid gap-3 text-sm">
          {queue.map((row) => (
            <li key={row.id} className="rounded-control border border-line p-3">
              <p>
                {row.display_name} · {row.skill_name} · {row.flags} flags · {row.review_status}
              </p>
              <div className="mt-2 flex gap-3">
                <button type="button" className="font-semibold text-accent" onClick={() => void decideReview({ data: { id: row.id, outcome: "approved", reason: "Work shown checks out" } })}>
                  Approve
                </button>
                <button type="button" className="font-semibold text-accent" onClick={() => void decideReview({ data: { id: row.id, outcome: "proof", reason: "Send more proof of the work" } })}>
                  Request proof
                </button>
                <button type="button" className="font-semibold text-accent" onClick={() => void decideReview({ data: { id: row.id, outcome: "rejected", reason: "The work shown could not be accepted" } })}>
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-2xl">Work reviews</h2>
        <p className="mt-2 text-sm text-muted">A review is hidden until you show it. Hide removes it from the public profile. The writer cannot delete it.</p>
        <Button
          className="mt-3"
          variant="secondary"
          onClick={() => {
            void adminWorkReviews().then((result) => {
              if (result.ok) setWorkReviews(result.data);
              else setError(result.error);
            });
          }}
        >
          Load reviews
        </Button>
        <ul className="mt-3 grid gap-3 text-sm">
          {workReviews.map((row) => (
            <li key={row.id} className="rounded-control border border-line p-3">
              <p>
                {row.authorName} · {row.stars} of 5 · {row.listingId} · {row.visible ? "Visible" : "Hidden"}
              </p>
              <p className="mt-1 text-muted">{row.body}</p>
              <button
                type="button"
                className="mt-2 font-semibold text-accent"
                onClick={() => {
                  void adminShowReview({ data: { id: row.id, visible: !row.visible } }).then((result) => {
                    if (!result.ok) setError(result.error);
                    else setWorkReviews((current) => current.map((item) => (item.id === row.id ? { ...item, visible: !row.visible } : item)));
                  });
                }}
              >
                {row.visible ? "Hide" : "Make visible"}
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-2xl">Open reports</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {report?.reports.map((row, index) => (
            <li key={`${row.listing_id}-${index}`}>
              {row.listing_id} · {row.reason} {row.note}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-2xl">Deletion requests</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {report?.deletions.map((row, index) => (
            <li key={`${row.user_id}-${index}`}>
              {row.status}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-2xl">Consent records</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {report?.consents.map((row, index) => (
            <li key={`${row.user_id}-${index}`}>
              {row.country} · v{row.version} · {row.language}
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}
