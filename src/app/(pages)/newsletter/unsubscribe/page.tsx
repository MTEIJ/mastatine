import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import { unsubscribeSubscriber, verifyUnsubscribeToken } from "@/lib/newsletter";
import { Button } from "@/components/ui/Button";
import { buttonClass } from "@/components/ui/classes";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

async function unsubscribe(formData: FormData) {
  "use server";
  const id = verifyUnsubscribeToken(String(formData.get("token") ?? ""));
  if (id) await unsubscribeSubscriber(id);
  redirect(`/newsletter/unsubscribe?status=${id ? "done" : "invalid"}`);
}

export const instant = false;

export default async function UnsubscribePage(props: { searchParams: Promise<{ t?: string; status?: string }> }) {
  const { t, status } = await props.searchParams;

  if (status === "done") {
    return (
      <>
        <PageHeader keepInApp title="You are unsubscribed" intro="We will not email you again. Sorry to see you go; the masts will still be here." />
        <div className="container-prose">
          <Link href="/" className={buttonClass({ variant: "primary" })}>Back to the masts</Link>
        </div>
      </>
    );
  }

  if (status === "invalid" || !t || !verifyUnsubscribeToken(t)) {
    return (
      <>
        <PageHeader keepInApp title="This link is not valid" intro="If you keep receiving emails you do not want, contact us and we will remove you right away." />
        <div className="container-prose">
          <Link href="/contact" className={buttonClass({ variant: "primary" })}>Contact us</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Unsubscribe" intro="Press the button to stop receiving the M.A. Mastatine newsletter." />
      <div className="container-prose">
        <form action={unsubscribe}>
          <input type="hidden" name="token" value={t} />
          <Button type="submit" variant="primary" className="px-6 py-3 text-base">Unsubscribe me</Button>
        </form>
      </div>
    </>
  );
}
