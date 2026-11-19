import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { membershipApprovedEmail } from "./email-templates";
import { whatsappGroupUrl } from "./env";

const INVITE = "https://chat.whatsapp.com/AbCdEf123456";

describe("whatsappGroupUrl", () => {
  it("accepts a WhatsApp invite link", () => {
    assert.equal(whatsappGroupUrl(INVITE), INVITE);
    assert.equal(whatsappGroupUrl(`  ${INVITE}  `), INVITE);
  });
  it("is off when unset and refuses anything that is not an https invite link", () => {
    for (const value of [undefined, "", "http://chat.whatsapp.com/AbC", "https://evil.example/AbC", "https://chat.whatsapp.com.evil.example/AbC", "https://chat.whatsapp.com/", "javascript:alert(1)"]) {
      assert.equal(whatsappGroupUrl(value), null, String(value));
    }
  });
});

describe("membershipApprovedEmail", () => {
  it("invites to the WhatsApp group with a button and the written-out link", () => {
    const mail = membershipApprovedEmail("Sam", INVITE);
    assert.match(mail.html, new RegExp(`<a href="${INVITE}"[^>]*>Join the WhatsApp group`));
    assert.match(mail.html, new RegExp(`>${INVITE}</a>`));
    assert.match(mail.text, new RegExp(`Join the WhatsApp group: ${INVITE}`));
    // Green invite first, the orange MastApps button right after it.
    assert.match(mail.html, /background:#25d366[^>]*>Join the WhatsApp group[\s\S]*?<\/a><a [^>]*background:#f57f20[^>]*>Open MastApps/);
  });
  it("keeps the old email without a group link", () => {
    const mail = membershipApprovedEmail("Sam", null);
    assert.doesNotMatch(mail.html + mail.text, /WhatsApp/);
    assert.match(mail.text, /Open MastApps/);
  });
});
