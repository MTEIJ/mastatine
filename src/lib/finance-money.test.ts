import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { budgetStatus, centsToDecimal, parseEuroToCents, suggestedExpenseCents } from "./finance-money";

describe("parseEuroToCents", () => {
  it("reads whole euros and one or two decimals, with comma or dot", () => {
    assert.equal(parseEuroToCents("12"), 1200);
    assert.equal(parseEuroToCents("12.5"), 1250);
    assert.equal(parseEuroToCents("12,50"), 1250);
    assert.equal(parseEuroToCents("0,05"), 5);
    assert.equal(parseEuroToCents(" € 7,5 "), 750);
  });

  it("is exact where floating point is not", () => {
    assert.equal(parseEuroToCents("0.29"), 29);
    assert.equal(parseEuroToCents("1.15"), 115);
  });

  it("rejects signs, thousands separators, extra decimals and text", () => {
    for (const bad of ["", "-5", "+5", "1.234,56", "1,234.56", "12.345", "abc", "1e3", "12,", ",5", "1234567890"]) {
      assert.equal(parseEuroToCents(bad), null, bad);
    }
  });
});

describe("centsToDecimal", () => {
  it("formats with two decimals and keeps the sign", () => {
    assert.equal(centsToDecimal(123456), "1234.56");
    assert.equal(centsToDecimal(5), "0.05");
    assert.equal(centsToDecimal(-250), "-2.50");
  });
});

describe("budgetStatus", () => {
  const base = { plannedExpenseCents: 10000, plannedIncomeCents: 0, spentCents: 0, receivedCents: 0 };

  it("has no budget when nothing is planned and nothing spent", () => {
    assert.equal(budgetStatus({ ...base, plannedExpenseCents: 0 }).state, "no-budget");
  });

  it("flags spending without any budget as over", () => {
    assert.equal(budgetStatus({ ...base, plannedExpenseCents: 0, spentCents: 100 }).state, "over");
  });

  it("moves from on-track to near-limit at 85% and over above 100%", () => {
    assert.equal(budgetStatus({ ...base, spentCents: 8499 }).state, "on-track");
    assert.equal(budgetStatus({ ...base, spentCents: 8500 }).state, "near-limit");
    assert.equal(budgetStatus({ ...base, spentCents: 10000 }).state, "near-limit");
    assert.equal(budgetStatus({ ...base, spentCents: 10001 }).state, "over");
  });

  it("reports what is left, capped bar and net result", () => {
    const status = budgetStatus({ ...base, spentCents: 12000, receivedCents: 5000 });
    assert.equal(status.remainingCents, -2000);
    assert.equal(status.percentSpent, 100);
    assert.equal(status.netCents, -7000);
  });
});

describe("suggestedExpenseCents", () => {
  it("multiplies cost by attendees when both are known and non-zero", () => {
    assert.equal(suggestedExpenseCents(500, 20), 10000);
    assert.equal(suggestedExpenseCents(null, 20), null);
    assert.equal(suggestedExpenseCents(500, null), null);
    assert.equal(suggestedExpenseCents(0, 20), null);
  });
});
