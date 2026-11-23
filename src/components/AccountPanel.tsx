"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { NAME_MAX, validateDisplayName } from "@/lib/profile";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { cardClass } from "@/components/ui/classes";

const PencilIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
  </svg>
);

type Editing = "none" | "name" | "email";

/**
 * Who you are, in one card: the avatar, your display name and your email address. Each is edited in place (the pencil
 * and "Change" turn the line into a field), so there is no separate form repeating what the header already shows.
 */
export function ProfileCard({ initialName, email }: { initialName: string; email: string }) {
  const id = useId();
  const router = useRouter();
  const [editing, setEditing] = useState<Editing>("none");
  const [name, setName] = useState(initialName);
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const initial = (initialName.trim().charAt(0) || email.charAt(0)).toUpperCase();

  function edit(what: Editing) {
    setEditing(what);
    setError("");
    setNotice("");
    setName(initialName);
    setNewEmail("");
  }

  async function saveName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const checked = validateDisplayName(name);
    if ("error" in checked) return setError(checked.error);
    setBusy(true);
    const { error: updateError } = await authClient.updateUser({ name: checked.name });
    setBusy(false);
    if (updateError) return setError("Could not save your name. Please try again.");
    setEditing("none");
    setNotice("Name saved.");
    router.refresh();
  }

  async function changeEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const address = newEmail.trim().toLowerCase();
    if (address === email.toLowerCase()) return setError("That is already your email address.");
    setBusy(true);
    const { error: changeError } = await authClient.changeEmail({ newEmail: address, callbackURL: "/account?email=changed" });
    setBusy(false);
    if (changeError) {
      return setError(changeError.status === 429 ? "Too many attempts. Please try again later." : "Could not start the email change. Check the address and try again.");
    }
    setEditing("none");
    setNotice("If that address can be used, we sent it a confirmation link. Your email changes once you open it.");
  }

  return (
    <section aria-label="Your profile" className={cardClass("profile")}>
      <span className="avatar" aria-hidden>{initial}</span>
      <div className="profile__who">
        {editing === "name" ? (
          <form onSubmit={saveName} className="profile__form">
            <label className="sr-only" htmlFor={`${id}-name`}>Display name</label>
            <Input id={`${id}-name`} className="min-w-0 flex-1" value={name} maxLength={NAME_MAX} autoFocus autoComplete="nickname" onChange={(e) => setName(e.target.value)} />
            <div className="profile__actions">
              <Button type="button" variant="ghost" size="sm" onClick={() => edit("none")}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" disabled={busy || !name.trim() || name.trim() === initialName}>Save</Button>
            </div>
          </form>
        ) : (
          <div className="profile__line">
            <h1 className="profile__name">{initialName || "Your account"}</h1>
            <button type="button" className="profile__edit" onClick={() => edit("name")} aria-label="Edit your display name">
              <PencilIcon />
            </button>
          </div>
        )}

        {editing === "email" ? (
          <form onSubmit={changeEmail} className="profile__form">
            <label className="sr-only" htmlFor={`${id}-email`}>New email address</label>
            <Input
              id={`${id}-email`}
              type="email"
              className="min-w-0 flex-1"
              placeholder="New email address"
              autoComplete="email"
              autoFocus
              maxLength={254}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <div className="profile__actions">
              <Button type="button" variant="ghost" size="sm" onClick={() => edit("none")}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" disabled={busy || !newEmail.trim()}>{busy ? "Sending…" : "Send link"}</Button>
            </div>
          </form>
        ) : (
          <div className="profile__line">
            <p className="profile__email">{email}</p>
            <button type="button" className="profile__change" onClick={() => edit("email")} aria-label="Change your email address">
              Change
            </button>
          </div>
        )}

        {notice && <p role="status" className="profile__note text-success">{notice}</p>}
        {error && <p role="alert" className="profile__note text-danger">{error}</p>}
      </div>
    </section>
  );
}

/** Your data: download it, or delete the account. Rows in the settings list, at the bottom of the page. */
export function AccountDataRows() {
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");

  async function deleteAccount() {
    setError("");
    const { error: deleteError } = await authClient.deleteUser();
    if (deleteError) {
      setConfirmingDelete(false);
      return setError(
        deleteError.status === 400 || deleteError.status === 403
          ? "For your security, please sign out, sign in again with a fresh link, and then delete your account."
          : "Could not delete your account. Please try again or contact us.",
      );
    }
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <a href="/api/account/export" download className="setting-row setting-row--link">
        <span className="setting-row__body">
          <span className="setting-row__title">Download my data</span>
          <span className="setting-row__text">Everything we store about you, as a file.</span>
        </span>
        <span aria-hidden className="setting-row__chevron">&rsaquo;</span>
      </a>
      <details className="setting-row setting-row--details">
        <summary className="setting-row__summary">
          <span className="setting-row__body">
            <span className="setting-row__title text-danger">Delete account</span>
            <span className="setting-row__text">Removes your account and your newsletter subscription.</span>
          </span>
          <span aria-hidden className="setting-row__chevron">&rsaquo;</span>
        </summary>
        <div className="setting-row__more">
          <p className="text-sm text-muted">Masts you submitted stay in the gallery; ask us if you want them removed too.</p>
          {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-3">
            {confirmingDelete ? (
              <>
                <Button type="button" variant="danger" size="sm" onClick={deleteAccount}>Yes, delete my account</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
              </>
            ) : (
              <Button type="button" variant="danger" size="sm" onClick={() => setConfirmingDelete(true)}>Delete my account</Button>
            )}
          </div>
        </div>
      </details>
    </>
  );
}
