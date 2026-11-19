import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Card";
import { Hint, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { buttonClass, type ButtonVariant } from "@/components/ui/classes";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Styleguide", robots: { index: false, follow: false } };

export const instant = false;

const VARIANTS: { variant: ButtonVariant; use: string }[] = [
  { variant: "primary", use: "The one main action on a screen." },
  { variant: "secondary", use: "Every other button (tonal)." },
  { variant: "ghost", use: "Low emphasis, next to another button." },
  { variant: "danger", use: "Deletes or ends something." },
];

const COLOURS = [
  ["primary", "bg-primary text-on-primary"],
  ["primary-container", "bg-primary-container text-on-primary-container"],
  ["secondary-container", "bg-secondary-container text-on-secondary-container"],
  ["tertiary-container", "bg-tertiary-container text-on-tertiary-container"],
  ["brand", "bg-brand text-on-brand"],
  ["canvas", "bg-canvas text-on-surface"],
  ["surface-container", "bg-surface-container text-on-surface"],
  ["surface-container-highest", "bg-surface-container-highest text-on-surface"],
  ["error", "bg-error text-on-primary"],
] as const;

const CORNERS = ["rounded-xs", "rounded-sm", "rounded-md", "rounded-lg", "rounded-lg-plus", "rounded-xl", "rounded-xl-plus", "rounded-2xl", "rounded-full"];

function Section({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-muted">{intro}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Controls() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-5">
        <div className="flex flex-wrap gap-2">
          {VARIANTS.map(({ variant }) => <Button key={variant} type="button" variant={variant}>{variant}</Button>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {VARIANTS.map(({ variant }) => <Button key={variant} type="button" variant={variant} size="sm">{variant} sm</Button>)}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" variant="primary" disabled>Disabled</Button>
          <Link href="/styleguide" className={buttonClass({ variant: "secondary", size: "sm" })}>A Link as a button</Link>
          <Badge>Member</Badge>
          <Badge>3 going</Badge>
        </div>
      </Card>
      <Card className="space-y-4 p-5">
        <div>
          <Label htmlFor="sg-name">Name</Label>
          <Input id="sg-name" placeholder="e.g. Jan de Vries" />
          <Hint>Shown on your activity sign-ups.</Hint>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="sg-committee">Committee</Label>
            <Select id="sg-committee" defaultValue="board">
              <option value="board">Board</option>
              <option value="activities">Activities</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="sg-date">Date</Label>
            <Input id="sg-date" type="date" />
          </div>
        </div>
        <div>
          <Label htmlFor="sg-notes">Notes</Label>
          <Textarea id="sg-notes" rows={2} placeholder="Anything we should know?" />
        </div>
      </Card>
    </div>
  );
}

/** Every shared control and token on one page, in each of its looks. Admin only. */
export default async function StyleguidePage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="Styleguide" intro="The shared controls and tokens. Build screens from these; ESLint and stylelint keep raw class names and colours out." />
      <div className="container-page pb-6">
        <Section title="Buttons, fields, cards" intro="From src/components/ui. Open this page in the installed app to see the expressive motion.">
          <Controls />
          <ul className="mt-4 grid gap-1 text-sm text-muted sm:grid-cols-2">
            {VARIANTS.map(({ variant, use }) => <li key={variant}><strong className="text-ink">{variant}</strong>: {use}</li>)}
          </ul>
        </Section>

        <Section title="Dense (admin and finance)" intro="The same components inside .admin-compact: flatter, squarer, smaller.">
          <div className="admin-compact">
            <Controls />
          </div>
        </Section>

        <Section title="Colour roles" intro="Material 3 roles from the brand orange, in src/app/tokens.css. Tailwind's own palette is switched off.">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {COLOURS.map(([name, cls]) => (
              <li key={name} className={`rounded-md px-3 py-4 text-sm font-bold ${cls}`}>{name}</li>
            ))}
          </ul>
        </Section>

        <Section title="Corners" intro="The M3 shape scale: the only rounded-* classes there are.">
          <ul className="flex flex-wrap gap-3">
            {CORNERS.map((c) => (
              <li key={c} className={`grid h-20 w-24 place-items-center border border-outline-variant bg-surface-container-low text-xs font-bold ${c}`}>{c.replace("rounded-", "")}</li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  );
}
