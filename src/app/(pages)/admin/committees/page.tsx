import sql from "@/lib/db";
import ConfirmButton from "@/components/admin/ConfirmButton";
import MemberSearch from "@/components/admin/MemberSearch";
import { displayName, getPendingJoinRequests } from "@/lib/committees";
import { addCommitteeMember, approveJoinRequest, createCommittee, declineJoinRequest, deleteCommittee, removeCommitteeMember, setCommitteeVisibility, toggleCommitteeChair, updateCommittee } from "../actions";
import { requireAdmin } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { buttonClass, cardClass } from "@/components/ui/classes";

/** Members named in the table row; the rest are one click away in the edit menu. */
const SHOWN = 4;

interface CommitteeRow {
  id: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  is_public: boolean;
}

interface MemberRow {
  committee_id: string;
  user_id: string;
  name: string;
  email: string;
  is_chair: boolean;
}

export const instant = false;

export default async function AdminCommittees() {
  // Layouts do not re-run on client navigation, so each admin page checks the role itself.
  await requireAdmin();
  const [committees, members, requests] = await Promise.all([
    sql<CommitteeRow[]>`SELECT id, name, description, banner_url, is_public FROM committees ORDER BY name`,
    sql<MemberRow[]>`
      SELECT m.committee_id, u.id AS user_id, u.name, u.email, m.is_chair
      FROM committee_members m JOIN "user" u ON u.id = m.user_id ORDER BY m.is_chair DESC, u.name, u.email
    `,
    getPendingJoinRequests(),
  ]);

  return (
    <div className="space-y-3">
      <form action={createCommittee} className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1 basis-40">
          <Label htmlFor="committee-name">New committee</Label>
          <Input id="committee-name" name="name" required maxLength={80} />
        </div>
        <div className="min-w-0 flex-[2] basis-56">
          <Label htmlFor="committee-description">Description</Label>
          <Input id="committee-description" name="description" maxLength={400} />
        </div>
        <Button variant="primary" size="sm" type="submit">Add committee</Button>
      </form>

      {requests.length > 0 && (
        <section aria-label="Join requests" className={cardClass("space-y-2 p-4")}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-accent-text">Join requests ({requests.length})</h2>
          <ul className="divide-y divide-line">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-2 text-sm">
                <div className="min-w-0 flex-1 basis-60">
                  <p>
                    <span className="font-bold">{displayName(r)}</span> wants to join{" "}
                    <span className="font-bold">{committees.find((c) => c.id === r.committee_id)?.name}</span>
                  </p>
                  {r.message && <p className="mt-1 whitespace-pre-line text-muted">{r.message}</p>}
                </div>
                <div className="flex gap-1">
                  <form action={approveJoinRequest}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button variant="primary" size="sm" type="submit">Approve</Button>
                  </form>
                  <form action={declineJoinRequest}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button variant="secondary" size="sm" type="submit">Decline</Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Not .table-wrap: it clips overflow, and the row menu has to hang below its row. */}
      <div className="table-open">
        <table className="table table-stack">
          <thead>
            <tr>
              <th>Committee</th>
              <th>Members</th>
              <th className="text-right"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {committees.map((c) => {
              const own = members.filter((m) => m.committee_id === c.id);
              return (
                <tr key={c.id}>
                  <td data-primary>
                    <span className="font-medium">{c.name}</span>
                    {!c.is_public && <Badge className="ml-2 !bg-soft !text-muted">Hidden from site</Badge>}
                    {c.description && <span className="block text-xs font-normal text-muted">{c.description}</span>}
                  </td>
                  <td data-label="Members" className="sm:max-w-md">
                    {own.length === 0 ? (
                      <span className="text-muted">No members yet</span>
                    ) : (
                      <span>
                        <span className="tabular-nums text-muted">{own.length} · </span>
                        {own.slice(0, SHOWN).map((m, i) => (
                          <span key={m.user_id}>
                            {i > 0 && ", "}
                            <span className={m.is_chair ? "font-bold" : ""} title={m.is_chair ? "Chair" : undefined}>{displayName(m)}{m.is_chair && " ★"}</span>
                          </span>
                        ))}
                        {own.length > SHOWN && <span className="text-muted"> +{own.length - SHOWN} more</span>}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex w-full items-start justify-end gap-1.5 max-sm:flex-col">
                      <form action={setCommitteeVisibility} className="max-sm:w-full">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="public" value={c.is_public ? "false" : "true"} />
                        <Button variant="secondary" size="sm" className="max-sm:w-full" type="submit" title={c.is_public ? "Remove from the public committee pages" : "Show on the public committee pages"}>
                          {c.is_public ? "Hide from site" : "Show on site"}
                        </Button>
                      </form>
                      <details className="popover max-sm:w-full">
                        <summary className={buttonClass({ variant: "secondary", size: "sm" }, "max-sm:w-full")} aria-label={`Edit ${c.name}`} title="Edit"><span className="sm:hidden">Edit</span><span aria-hidden="true" className="max-sm:hidden text-base leading-none">⋯</span></summary>
                        <div className="popover__panel space-y-4 text-sm">
                          <section aria-label="Members" className="space-y-1.5">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-muted">Members ({own.length})</h3>
                            {own.length > 0 && (
                              <ul className="max-h-56 divide-y divide-line overflow-y-auto">
                                {own.map((m) => (
                                  <li key={m.user_id} className="flex items-center justify-between gap-2 py-1">
                                    <span className="min-w-0 truncate">{displayName(m)}{m.is_chair && <Badge className="ml-1.5">chair</Badge>}</span>
                                    <span className="flex shrink-0 gap-1">
                                      <form action={toggleCommitteeChair}>
                                        <input type="hidden" name="committeeId" value={c.id} />
                                        <input type="hidden" name="userId" value={m.user_id} />
                                        <Button variant="secondary" size="sm" type="submit">{m.is_chair ? "Unchair" : "Chair"}</Button>
                                      </form>
                                      <form action={removeCommitteeMember}>
                                        <input type="hidden" name="committeeId" value={c.id} />
                                        <input type="hidden" name="userId" value={m.user_id} />
                                        <Button variant="secondary" size="sm" type="submit" aria-label={`Remove ${displayName(m)}`}>Remove</Button>
                                      </form>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <MemberSearch committeeId={c.id} committeeName={c.name} action={addCommitteeMember} />
                          </section>

                          <form action={updateCommittee} aria-label="Details" className="space-y-2 border-t border-line pt-3">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-muted">Details</h3>
                            <input type="hidden" name="id" value={c.id} />
                            <div>
                              <Label htmlFor={`committee-name-${c.id}`}>Name</Label>
                              <Input id={`committee-name-${c.id}`} name="name" required maxLength={80} defaultValue={c.name} />
                            </div>
                            <div>
                              <Label htmlFor={`committee-desc-${c.id}`}>Description</Label>
                              <Textarea id={`committee-desc-${c.id}`} name="description" className="min-h-16" maxLength={400} defaultValue={c.description ?? ""} />
                            </div>
                            <div>
                              <Label htmlFor={`committee-banner-${c.id}`}>Banner</Label>
                              {c.banner_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={c.banner_url} alt="" className="mb-2 h-16 w-full rounded-sm border border-line object-cover" />
                              )}
                              <Input id={`committee-banner-${c.id}`} name="banner" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
                              {c.banner_url && (
                                <label className="choice-row mt-2">
                                  <input type="checkbox" name="removeBanner" className="mt-0" />
                                  <span>Remove the current banner</span>
                                </label>
                              )}
                            </div>
                            <Button variant="primary" size="sm" type="submit">Save details</Button>
                          </form>

                          <form action={deleteCommittee} className="border-t border-line pt-3">
                            <input type="hidden" name="id" value={c.id} />
                            <ConfirmButton message={`Delete ${c.name}? Its activities, meetings and action points are deleted too.`} className={buttonClass({ variant: "danger", size: "sm" })}>Delete committee</ConfirmButton>
                          </form>
                        </div>
                      </details>
                    </div>
                  </td>
                </tr>
              );
            })}
            {committees.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-muted">No committees yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
