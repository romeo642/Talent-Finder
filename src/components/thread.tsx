import { useEffect, useState } from "react";
import { Button, Note } from "@/components/ui";
import { listMessages, postMessage } from "@/lib/hire-api";

export function Thread({ requestId }: { requestId: string }) {
  const [rows, setRows] = useState<{ id: string; mine: boolean; body: string }[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  function load() {
    void listMessages({ data: { requestId } }).then((result) => {
      if (result.ok) setRows(result.data);
    });
  }

  useEffect(() => {
    load();
  }, [requestId]);

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">Messages</p>
      <p className="text-xs text-muted">These stay in the app. Translation is not connected.</p>
      <ul className="grid gap-2">
        {rows.map((row) => (
          <li key={row.id} className={row.mine ? "text-sm" : "text-sm text-muted"}>
            {row.mine ? "You: " : "Them: "}
            {row.body}
          </li>
        ))}
      </ul>
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          void postMessage({ data: { requestId, body } }).then((result) => {
            if (!result.ok) setError(result.error);
            else {
              setBody("");
              load();
            }
          });
        }}
      >
        <textarea
          value={body}
          maxLength={500}
          onChange={(event) => setBody(event.target.value)}
          className="min-h-16 rounded-control border border-line bg-paper p-3 text-sm"
          placeholder="Write a short message"
        />
        <Button type="submit">Send</Button>
        {error ? <Note>{error}</Note> : null}
      </form>
    </div>
  );
}
