import ConfirmButton from "@/components/admin/ConfirmButton";
import { Input } from "@/components/ui/Field";
import { buttonClass } from "@/components/ui/classes";

interface MembershipEndFormProps {
  /** declineMember for a pending request, revokeMember for an approved membership. */
  action: (formData: FormData) => Promise<void>;
  userId: string;
  label: "Decline" | "Remove";
  confirm: string;
}

/** Declining a request or ending a membership: an optional reason, which is emailed to the person. */
export default function MembershipEndForm({ action, userId, label, confirm }: MembershipEndFormProps) {
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <Input name="reason" maxLength={300} placeholder="Reason (optional, emailed)" aria-label={`Reason to ${label.toLowerCase()} (optional, emailed)`} className="!py-1.5 min-w-0 flex-1 basis-44" />
      <ConfirmButton message={confirm} className={buttonClass({ variant: "secondary", size: "sm" })}>{label}</ConfirmButton>
    </form>
  );
}
