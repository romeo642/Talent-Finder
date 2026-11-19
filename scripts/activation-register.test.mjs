import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const register = JSON.parse(readFileSync(new URL("../src/lib/activation-register.json", import.meta.url), "utf8"));
const allowed = new Set(["Off", "Built", "Connected", "Proven", "Blocked"]);

test("activation register has no unproven Proven rows", () => {
  assert.equal(register.auditedOn, "2026-11-04");
  const ids = new Set();
  for (const row of register.rows) {
    assert.equal(ids.has(row.id), false, row.id);
    ids.add(row.id);
    assert.equal(allowed.has(row.status), true, row.status);
    assert.equal(row.status === "Proven", false, `${row.id} is not proven`);
    assert.ok(row.test.length > 10);
    assert.ok(row.notes.length > 10);
  }
  assert.ok(ids.has("contact"));
  assert.ok(ids.has("age"));
  assert.ok(ids.has("plans"));
});
