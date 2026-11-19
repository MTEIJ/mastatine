import type { Metadata } from "next";
import AppFrame from "@/components/ui/AppFrame";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { toLocalInput } from "@/lib/datetime";
import { deleteMeeting, updateMeeting } from "../../../actions";
import MeetingFields from "../../MeetingFields";
import { loadEditableMeeting } from "../access";
import { Button } from "@/components/ui/Button";
import { buttonClass, cardClass } from "@/components/ui/classes";

export const metadata: Metadata = { title: "Meeting details", robots: { index: false } };

export const instant = false;

export default async function EditMeetingPage(props: { params: Promise<{ id: string }> }) {
  const { meeting } = await loadEditableMeeting(props.params);

  return (
    <AppFrame title="Meeting details" tagline={meeting.committee_name}>
      <form action={updateMeeting} className={cardClass("space-y-5 p-6 sm:p-8")}>
        <input type="hidden" name="id" value={meeting.id} />
        <MeetingFields defaults={{ title: meeting.title, location: meeting.location, starts_at: toLocalInput(meeting.starts_at) }} />
        <Button type="submit" variant="primary">Save</Button>
      </form>
      <form action={deleteMeeting} className="mt-6">
        <input type="hidden" name="id" value={meeting.id} />
        <ConfirmButton message="Delete this meeting with its agenda, minutes and action points?" className={buttonClass({ variant: "danger" })}>Delete meeting</ConfirmButton>
      </form>
    </AppFrame>
  );
}
