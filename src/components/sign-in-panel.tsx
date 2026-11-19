import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authClient, GROK_PROVIDERS, rememberSessionToken, signIn } from "@/lib/auth/client";
import { saveSignupContact } from "@/lib/listings-api";
import { socialSignupEmail, type SocialSignup } from "@/lib/social-account";
import { Button, controlClass, Note } from "@/components/ui";

type SignChoice = "email" | SocialSignup | "google" | "x";

const SIGN_UP_CHOICES: { id: SignChoice; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "google", label: "Google" },
  { id: "x", label: "X" },
];

const HANDLE_HINT: Record<SocialSignup, string> = {
  facebook: "@yourpage",
  instagram: "@yourname",
  tiktok: "@yourname",
};

function isSocial(choice: SignChoice): choice is SocialSignup {
  return choice === "facebook" || choice === "instagram" || choice === "tiktok";
}

export function SignInPanel({
  title,
  callbackURL = "/list",
  mode = "in",
}: {
  title?: string;
  callbackURL?: string;
  mode?: "in" | "up";
}) {
  const navigate = useNavigate();
  const creating = mode === "up";
  const [choice, setChoice] = useState<SignChoice>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const social = isSocial(choice);
  const broker = choice === "google" ? "grok-google" : choice === "x" ? "grok-x" : "";
  const brokerKnown = GROK_PROVIDERS.some((provider) => provider.providerId === broker);
  const networkLabel = choice === "facebook" ? "Facebook" : choice === "instagram" ? "Instagram" : choice === "tiktok" ? "TikTok" : "";

  function pick(next: SignChoice) {
    setChoice(next);
    setHandle("");
    setError("");
  }

  function switchMode(next: "in" | "up") {
    setError("");
    setChoice("email");
    void navigate({ to: "/login", search: next === "up" ? { mode: "up" } : {} });
  }

  async function continueWithBroker() {
    setError("");
    if (!brokerKnown) {
      setError("That sign-in is not connected yet.");
      return;
    }
    setBusy(true);
    try {
      await signIn(broker, { callbackURL });
    } catch {
      setError("Could not open sign-in. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitAccount(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (creating && name.trim().length < 2) {
      setError("Enter the name people should see.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for the password.");
      return;
    }
    let accountEmail = email.trim().toLowerCase();
    let savedHandle = "";
    if (social) {
      try {
        const parsed = socialSignupEmail(choice, handle);
        accountEmail = parsed.email;
        savedHandle = parsed.handle;
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "That name is not valid.");
        return;
      }
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail)) {
      setError("Enter a valid email.");
      return;
    }
    setBusy(true);
    try {
      const result = creating
        ? await authClient.signUp.email({ name: name.trim(), email: accountEmail, password, callbackURL })
        : await authClient.signIn.email({ email: accountEmail, password, callbackURL });
      if (result.error) {
        setError(result.error.message ?? (creating ? "Could not create the account." : social ? "That name or password is wrong." : "That email or password is wrong."));
        return;
      }
      const token =
        result.data && typeof result.data === "object" && "token" in result.data
          ? result.data.token
          : null;
      if (typeof token === "string" && token) rememberSessionToken(token);
      try {
        await authClient.getSession();
      } catch {
        /* the next page reads the session */
      }
      if (creating && social) {
        const saved = await saveSignupContact({
          data: {
            phone: "",
            facebook: choice === "facebook" ? savedHandle : "",
            instagram: choice === "instagram" ? savedHandle : "",
            tiktok: choice === "tiktok" ? savedHandle : "",
            twitter: "",
          },
        });
        if (!saved.ok) {
          setError(saved.error);
          return;
        }
      }
      window.location.assign(callbackURL);
    } catch {
      setError(creating ? "Could not create the account. Try again." : "Could not sign in. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const choices = creating ? SIGN_UP_CHOICES : SIGN_UP_CHOICES.filter((item) => item.id === "email" || item.id === "google" || item.id === "x" || isSocial(item.id));

  return (
    <div className="mx-auto w-full max-w-md rounded-card border border-line bg-paper p-6 sm:p-8">
      <h1 className="font-display text-title">{title ?? (creating ? "Create your account" : "Sign in")}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {creating
          ? "Pick one option. Facebook, Instagram, and TikTok use that public name and a password. They do not open those apps."
          : "Pick one option."}
      </p>
      <label className="mt-6 block">
        <span className="mb-2 block text-sm font-medium">{creating ? "Sign up with" : "Sign in with"}</span>
        <select value={choice} onChange={(event) => pick(event.target.value as SignChoice)} className={controlClass}>
          {choices.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      {broker ? (
        <div className="mt-4">
          <Button type="button" full disabled={busy || !brokerKnown} onClick={() => void continueWithBroker()}>
            {busy ? "Please wait…" : `Continue with ${choice === "x" ? "X" : "Google"}`}
          </Button>
        </div>
      ) : (
        <form className="mt-4 grid gap-3" onSubmit={(event) => void submitAccount(event)}>
          {creating ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className={controlClass} placeholder="Your name" />
            </label>
          ) : null}
          {social ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium">{networkLabel}</span>
              <input value={handle} onChange={(event) => setHandle(event.target.value)} autoComplete="off" className={controlClass} placeholder={HANDLE_HINT[choice]} />
            </label>
          ) : (
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" inputMode="email" className={controlClass} placeholder="name@email.com" />
            </label>
          )}
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={creating ? "new-password" : "current-password"} className={controlClass} placeholder={creating ? "At least 8 characters" : "Your password"} />
          </label>
          <Button type="submit" full disabled={busy}>
            {busy ? "Please wait…" : creating ? "Create account" : "Sign in"}
          </Button>
        </form>
      )}
      <button type="button" className="mt-4 text-sm font-semibold text-accent" onClick={() => switchMode(creating ? "in" : "up")}>
        {creating ? "Already have an account? Sign in" : "New here? Sign up"}
      </button>
      {error ? (
        <div className="mt-4">
          <Note>{error}</Note>
        </div>
      ) : null}
    </div>
  );
}
