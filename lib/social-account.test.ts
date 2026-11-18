import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { socialSignupEmail } from "./social-account.ts";

describe("social sign-up names", () => {
  it("accepts a Facebook name and a Facebook link", () => {
    assert.equal(socialSignupEmail("facebook", "@AmaPage").handle, "amapage");
    assert.equal(
      socialSignupEmail("facebook", "https://facebook.com/AmaPage").email,
      "facebook.amapage@signup.talentfinder.invalid",
    );
  });

  it("accepts an Instagram name", () => {
    const parsed = socialSignupEmail("instagram", "@ama.work");
    assert.equal(parsed.handle, "ama.work");
    assert.equal(parsed.email, "instagram.ama.work@signup.talentfinder.invalid");
  });

  it("accepts a TikTok name and rejects a blank one", () => {
    assert.equal(socialSignupEmail("tiktok", "https://www.tiktok.com/@ama_work").handle, "ama_work");
    assert.throws(() => socialSignupEmail("tiktok", "  "), /TikTok/);
  });

  it("rejects a Facebook name that is really an Instagram link", () => {
    assert.throws(() => socialSignupEmail("facebook", "https://instagram.com/ama"), /Facebook/);
  });
});
