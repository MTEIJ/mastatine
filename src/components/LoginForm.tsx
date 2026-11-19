"use client";

import { useEffect, useId, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { hasDisplayName } from "@/lib/profile";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";

type Status = "idle" | "sending" | "sent";

/**
 * After the link is opened, everyone passes the welcome page, which asks the newsletter question once.
 * New accounts choose a display name first, then continue to the welcome page.
 */
function destinations(next: string) {
  const welcome = `/welcome?next=${encodeURIComponent(next)}`;
  return { existing: welcome, created: `/account/name?next=${encodeURIComponent(welcome)}` };
}

export default function LoginForm({ next }: { next: string }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // The link often opens in a new tab: once it signs the visitor in, move this tab along too.
  useEffect(() => {
    if (status !== "sent") return;
    const timer = window.setInterval(async () => {
      const { data } = await authClient.getSession();
      if (data) window.location.assign(destinations(next).existing);
    }, 3000);
    const stop = window.setTimeout(() => window.clearInterval(timer), 10 * 60 * 1000);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, [status, next]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    const target = destinations(next);
    const { error: authError } = await authClient.signIn.magicLink({
      email: email.trim().toLowerCase(),
      callbackURL: target.existing,
      newUserCallbackURL: target.created,
    });
    if (authError) {
      setStatus("idle");
      setError(authError.status === 429 ? "Too many attempts. Please wait a minute and try again." : "We could not send a link right now. Please try again.");
      return;
    }
    setStatus("sent");
  }

  async function handleCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setVerifying(true);
    const { data, error: authError } = await authClient.signIn.emailOtp({ email: email.trim().toLowerCase(), otp: code });
    if (authError || !data) {
      setVerifying(false);
      setError(authError?.status === 429 ? "Too many attempts. Please wait a minute and try again." : "That code is not right or has expired. Check the email, or request a new one.");
      return;
    }
    const target = destinations(next);
    window.location.assign(hasDisplayName(data.user.name) ? target.existing : target.created);
  }

  if (status === "sent") {
    return (
      <div role="status" className="space-y-4">
        <p className="text-lg font-semibold">Check your inbox</p>
        <p className="text-muted">
          If <strong className="text-ink">{email}</strong> can sign in, we have sent a link and a six-digit code to it. Use either one: both work once and
          expire in 10 minutes. Nothing there? Check your spam folder.
        </p>
        <form onSubmit={handleCode} className="space-y-3" noValidate>
          <Label htmlFor={`${id}-code`}>Or enter the code</Label>
          <Input
            id={`${id}-code`}
            type="text"
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="text-center text-2xl tracking-[0.5em]"
            placeholder="000000"
          />
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={verifying || code.length !== 6} variant="primary" className="w-full py-3">
            {verifying ? "Checking…" : "Sign in with code"}
          </Button>
        </form>
        <Button type="button" variant="secondary" size="sm" onClick={() => { setStatus("idle"); setCode(""); setError(""); }}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor={`${id}-email`}>Email address</Label>
        <Input id={`${id}-email`} type="email" required autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={status === "sending" || !email} variant="primary" className="w-full py-3">
        {status === "sending" ? "Sending link…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
