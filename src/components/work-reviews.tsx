import { useEffect, useState } from "react";
import { Button, Note } from "@/components/ui";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listWorkReviews, submitWorkReview, type WorkReview } from "@/lib/reviews-api";

export function WorkReviews({ listingId }: { listingId: string }) {
  const { user } = useCurrentUserState();
  const [rows, setRows] = useState<WorkReview[]>([]);
  const [stars, setStars] = useState(5);
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");

  function load() {
    void listWorkReviews({ data: { id: listingId } }).then((result) => {
      if (result.ok) setRows(result.data);
    });
  }

  useEffect(() => {
    load();
  }, [listingId]);

  return (
    <section className="md:col-span-2 rounded-card border border-line bg-paper p-5">
      <h2 className="font-display text-2xl">Reviews of the work</h2>
      <p className="mt-2 text-sm text-muted">A review is shown only after an admin makes it visible. It is about the work, not a guarantee.</p>
      {rows.length === 0 ? <p className="mt-4 text-sm text-muted">No reviews are visible yet.</p> : null}
      <ul className="mt-4 grid gap-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded-control border border-line p-3">
            <p className="text-sm font-medium">{row.authorName} · {row.stars} of 5</p>
            <p className="mt-1 text-sm text-muted">{row.body}</p>
          </li>
        ))}
      </ul>
      {user ? (
        <form
          className="mt-5 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setNote("");
            void submitWorkReview({ data: { id: listingId, stars, body } }).then((result) => {
              if (!result.ok) setNote(result.error);
              else {
                setBody("");
                setNote("Saved. It stays hidden until an admin shows it.");
              }
            });
          }}
        >
          <label className="text-sm font-medium">
            Stars
            <select className="mt-1 h-11 w-full rounded-control border border-line bg-paper px-3" value={stars} onChange={(event) => setStars(Number(event.target.value))}>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
          <textarea
            value={body}
            maxLength={400}
            onChange={(event) => setBody(event.target.value)}
            className="min-h-20 rounded-control border border-line bg-paper p-3 text-sm"
            placeholder="What work did they do, and was it good?"
          />
          <Button type="submit">Send review</Button>
          {note ? <Note>{note}</Note> : null}
        </form>
      ) : (
        <p className="mt-4 text-sm text-muted">Sign in after a hire request is accepted if you want to review the work.</p>
      )}
    </section>
  );
}
