import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { ACTIVATION_AUDITED_ON, ACTIVATION_ROWS } from "@/lib/activation";

export const Route = createFileRoute("/activation")({ component: ActivationPage });

function ActivationPage() {
  const counts = ACTIVATION_ROWS.reduce<Record<string, number>>((bag, row) => {
    bag[row.status] = (bag[row.status] ?? 0) + 1;
    return bag;
  }, {});
  return (
    <Shell>
      <h1 className="font-display text-title">Activation register</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Audited {ACTIVATION_AUDITED_ON} against the running app. Proven means a test passed the whole flow. Nothing below is Proven yet.
      </p>
      <p className="mt-3 text-sm">
        {Object.entries(counts)
          .map(([status, count]) => `${status} ${count}`)
          .join(" · ")}
      </p>
      <div className="mt-6 overflow-x-auto rounded-card border border-line bg-paper">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Feature</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Owner</th>
              <th className="px-3 py-2 font-medium">Test</th>
            </tr>
          </thead>
          <tbody>
            {ACTIVATION_ROWS.map((row) => (
              <tr key={row.id} className="border-b border-line align-top">
                <td className="px-3 py-3">
                  <p className="font-semibold">{row.feature}</p>
                  <p className="mt-1 text-muted">{row.notes}</p>
                </td>
                <td className="px-3 py-3">{row.status}</td>
                <td className="px-3 py-3">{row.owner}</td>
                <td className="px-3 py-3 text-muted">{row.test}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm">
        <Link to="/diagnostics" className="font-semibold text-accent">
          Open diagnostics
        </Link>
      </p>
    </Shell>
  );
}
