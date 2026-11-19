import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { markdownToPlainText, textToHtml } from "./email-format";
import { buttonTitle, buttonTone } from "./markdown-button";
import { button, stripMarkdown } from "./markdown-edit";

describe("buttonTone", () => {
  it("reads the colour from a link title", () => {
    assert.equal(buttonTone("button"), "dark");
    assert.equal(buttonTone(" Button Orange "), "orange");
    assert.equal(buttonTone("button green"), "green");
    for (const t of [undefined, null, "", "a button", "button purple", "buttons"]) assert.equal(buttonTone(t), null, String(t));
  });
  it("round-trips through buttonTitle", () => {
    for (const tone of ["dark", "orange", "green"] as const) assert.equal(buttonTone(buttonTitle(tone)), tone);
  });
});

describe("the editor's button tool", () => {
  it("puts the button on its own line and selects the address", () => {
    const edit = button("Hello Sign up today", 6, 13, "button orange");
    assert.equal(edit.text, 'Hello \n[Sign up](https:// "button orange")\n today');
    assert.equal(edit.text.slice(edit.start, edit.end), "https://");
  });
  it("uses a placeholder without a selection", () => {
    assert.equal(button("", 0, 0, "button").text, '[Button text](https:// "button")');
  });
});

describe("buttons in emails", () => {
  it("draws a button in the chosen colour", () => {
    const html = textToHtml('Come along!\n[Sign up](https://example.com/x "button green")');
    assert.match(html, /<a href="https:\/\/example\.com\/x"[^>]*background:#25d366[^>]*>Sign up <span/);
  });
  it("makes on-site addresses absolute, as for links", () => {
    assert.match(textToHtml('[Agenda](/agenda "button")'), /href="http[^"]+\/agenda"[^>]*background:#161616/);
  });
  it("keeps an ordinary link for any other title", () => {
    const html = textToHtml('[Docs](https://example.com "read me")');
    assert.match(html, /<a href="https:\/\/example\.com" style="color:/);
  });
  it("refuses unsafe addresses, button or not", () => {
    assert.doesNotMatch(textToHtml('[x](javascript:alert(1) "button")'), /<a /);
  });
  it("cannot break out of the title", () => {
    const html = textToHtml('[x](https://example.com "button\\" onmouseover=\\"alert(1)")');
    assert.doesNotMatch(html, /onmouseover="/);
  });
  it("writes the address out in plain text", () => {
    assert.equal(markdownToPlainText('[Sign up](https://example.com "button orange")'), "Sign up (https://example.com)");
    assert.equal(stripMarkdown('[Sign up](https://example.com "button")'), "Sign up (https://example.com)");
  });
});
