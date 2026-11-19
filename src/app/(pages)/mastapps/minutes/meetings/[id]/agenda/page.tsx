import type { Metadata } from "next";
import AppFrame from "@/components/ui/AppFrame";
import { getItems } from "@/lib/meetings";
import { saveAgenda } from "../../../actions";
import AgendaEditor from "../../../AgendaEditor";
import { loadEditableMeeting } from "../access";
import { Button } from "@/components/ui/Button";
import { Hint } from "@/components/ui/Field";
import { cardClass, labelClass } from "@/components/ui/classes";

export const metadata: Metadata = { title: "Edit agenda", robots: { index: false } };

export const instant = false;

export default async function EditAgendaPage(props: { params: Promise<{ id: string }> }) {
  const { meeting } = await loadEditableMeeting(props.params);
  const items = await getItems(meeting.id);

  return (
    <AppFrame title="Edit agenda" tagline={meeting.title}>
      <form action={saveAgenda} className={cardClass("space-y-5 p-6 sm:p-8")}>
        <input type="hidden" name="id" value={meeting.id} />
        <div>
          <p className={labelClass()}>Agenda</p>
          <AgendaEditor initialItems={items.map(({ level, title }) => ({ level: level === 1 ? 1 : 0, title }))} />
          <Hint className="mt-3 text-muted">
            Press Enter to add the next item. Notes stay with an item as long as you keep its title, so rename items with care.
          </Hint>
        </div>
        <Button type="submit" variant="primary">Save agenda</Button>
      </form>
    </AppFrame>
  );
}
