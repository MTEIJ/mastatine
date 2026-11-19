import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { announcementId } from "./announcement-id";

describe("announcementId", () => {
  const base = announcementId("news", "Title", "Summary", "/news/title");

  it("is stable for the same message", () => {
    assert.equal(announcementId("news", "Title", "Summary", "/news/title"), base);
  });

  it("changes when anything visible changes", () => {
    assert.notEqual(announcementId("news", "Title 2", "Summary", "/news/title"), base);
    assert.notEqual(announcementId("news", "Title", "Other", "/news/title"), base);
    assert.notEqual(announcementId("news", "Title", "Summary", "/news/other"), base);
    assert.notEqual(announcementId("custom", "Title", "Summary", "/news/title"), base);
  });

  it("does not confuse field boundaries", () => {
    assert.notEqual(announcementId("custom", "ab", "c", null), announcementId("custom", "a", "bc", null));
  });
});
