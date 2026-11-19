import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppFrame from "@/components/ui/AppFrame";
import { displayName, getCommitteePeople } from "@/lib/committees";
import { getAction, getItems, itemLabels } from "@/lib/meetings";
import { requireUser } from "@/lib/session";
import AssigneePicker from "../../../AssigneePicker";
import { updateAction } from "../../../actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { buttonClass, cardClass } from "@/components/ui/classes";

export const metadata: Metadata = { title: "Edit action point", robots: { index: false } };

export const instant = false;

export default async function EditActionPage(props: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser();
  const { id } = await props.params;
  const action = /^[0-9a-f-]{36}$/i.test(id) ? await getAction(id, user) : null;
  if (!action) notFound();
  const meetingUrl = `/mastapps/minutes/meetings/${action.meeting_id}`;
  if (action.minutes_status === "locked") redirect(meetingUrl);

  const [people, items] = await Promise.all([getCommitteePeople(action.committee_id), getItems(action.meeting_id)]);
  const labels = itemLabels(items);

  return (
    <AppFrame title="Edit action point" tagline={action.committee_name}>
      <form action={updateAction} className={cardClass("max-w-xl space-y-4 p-6 sm:p-8")}>
        <input type="hidden" name="id" value={action.id} />
        <div>
          <Label htmlFor="body">Action point</Label>
          <Textarea id="body" name="body" required maxLength={500} defaultValue={action.body} />
        </div>
        <AssigneePicker people={people.map((p) => ({ id: p.id, label: displayName(p) }))} selected={action.assignees.map((a) => a.id)} />
        <div>
          <Label htmlFor="deadline">Deadline (empty: next meeting)</Label>
          <Input id="deadline" name="deadline" type="date" defaultValue={action.deadline ?? ""} />
        </div>
        <div>
          <Label htmlFor="item_id">Raised under</Label>
          <Select id="item_id" name="item_id" defaultValue={action.item_id ?? ""}>
            <option value="">No agenda item</option>
            {items.map((item, i) => <option key={item.id} value={item.id}>{labels[i]} {item.title}</option>)}
          </Select>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="primary">Save</Button>
          <Link href={meetingUrl} className={buttonClass({ variant: "secondary" })}>Cancel</Link>
        </div>
      </form>
    </AppFrame>
  );
}
