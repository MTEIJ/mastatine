import { describe, it } from "node:test";
import { RuleTester } from "eslint";
import designSystem from "./design-system.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: { ecmaVersion: "latest", sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } } },
});

tester.run("use-ui-controls", designSystem.rules["use-ui-controls"], {
  valid: [
    `<Button variant="primary">Save</Button>`,
    `<a className={buttonClass({ variant: "primary" })}>Go</a>`,
    `<span className="cal-btn--inline agenda-btn text-sm" />`,
    `<div className="labels cards p-4" />`,
    `const kind = "card";`,
  ],
  invalid: [
    { code: `<button className="btn btn-primary">Save</button>`, errors: [{ messageId: "raw" }] },
    { code: `<div className="card p-4" />`, errors: [{ messageId: "raw" }] },
    { code: "<input className={`input ${wide}`} />", errors: [{ messageId: "raw" }] },
    { code: `<span className={draft ? "text-muted" : "badge"} />`, errors: [{ messageId: "raw" }] },
    { code: `<Modal triggerClassName="btn btn-secondary btn-sm" />`, errors: [{ messageId: "raw" }] },
    { code: `const button = "btn btn-secondary btn-sm";`, errors: [{ messageId: "raw" }] },
  ],
});

tester.run("use-tokens", designSystem.rules["use-tokens"], {
  valid: [
    `<p className="text-muted bg-surface-container rounded-md border-outline-variant" />`,
    `<div className="rounded-t-sm rounded-full min-w-[40rem]" />`,
    `<div style={{ color: "var(--md-primary)" }} />`,
  ],
  invalid: [
    { code: `<p className="text-slate-500" />`, errors: [{ messageId: "palette" }] },
    { code: `<p className="hover:bg-red-50" />`, errors: [{ messageId: "palette" }] },
    { code: `<p className="text-[#3d3935]" />`, errors: [{ messageId: "arbitrary" }] },
    { code: `<p className="!border-[#6f655b]" />`, errors: [{ messageId: "arbitrary" }] },
    { code: `<p className="rounded p-2" />`, errors: [{ messageId: "radius" }] },
    { code: `<p className="rounded-3xl" />`, errors: [{ messageId: "radius" }] },
    { code: `<p style={{ color: "#555" }} />`, errors: [{ messageId: "hex" }] },
    { code: `<p style={{ color: on ? "#fff" : "var(--ink)" }} />`, errors: [{ messageId: "hex" }] },
  ],
});
