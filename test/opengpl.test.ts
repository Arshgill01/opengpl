import assert from "node:assert/strict";
import test from "node:test";
import { initialCases } from "../lib/fixtures";
import { buildCallTask, callingContext, exportApprovedCsv, parseProviderCsv, reviewCaseEvidence, reviewEvidence, stableIntentKey } from "../lib/opengpl";

test("clear fixture passes the evidence gate", () => {
  const item = initialCases[0];
  assert.deepEqual(reviewEvidence(item.result, item.transcript, item.confidence), []);
});

test("ambiguous package fixture stays in human review", () => {
  const item = initialCases[1];
  const issues = reviewEvidence(item.result, item.transcript, item.confidence);
  assert.ok(issues.some((issue) => issue.field === "confidence"));
  assert.ok(issues.some((issue) => issue.field === "immediate_burial"));
  assert.ok(issues.some((issue) => issue.field === "direct_cremation"));
  assert.ok(issues.some((issue) => issue.field === "excluded_fees"));
});

test("unsupported extracted amounts block approval", () => {
  const item = initialCases[2];
  const issues = reviewEvidence(item.result, item.transcript, item.confidence);
  assert.ok(issues.some((issue) => issue.field === "immediate_burial" && issue.severity === "block"));
  assert.ok(issues.some((issue) => issue.field === "direct_cremation" && issue.severity === "block"));
});

test("a declined platform outcome cannot be published as no answer", () => {
  const item = initialCases[0];
  const issues = reviewCaseEvidence({
    ...item,
    callStatus: "failed",
    result: item.result ? { ...item.result, reachOutcome: "no_answer" } : null,
    failureMessage: "calling task status=DECLINED (Hangup by: user)"
  });
  assert.ok(issues.some((issue) => issue.field === "terminal_disposition" && issue.severity === "block"));
});

test("CSV import requires E.164 and preserves quoted names", () => {
  const csv = [
    "name,locality,phone,authorization,authorization_note",
    '"Lake, Field & Sons","Durham, NC",+12025550144,authorized,"Written opt-in for prototype"'
  ].join("\n");
  const [provider] = parseProviderCsv(csv);
  assert.equal(provider.name, "Lake, Field & Sons");
  assert.equal(provider.authorization, "authorized");
  assert.equal(provider.phone, "+12025550144");
});

test("CSV import rejects an unrecognized authorization", () => {
  const csv = "name,locality,phone,authorization\nTest Home,Durham,+12025550144,assumed";
  assert.throws(() => parseProviderCsv(csv), /invalid authorization/u);
});

test("approved export includes only reviewed observations", () => {
  const csv = exportApprovedCsv([
    { ...initialCases[0], reviewDecision: "approved" },
    initialCases[1]
  ]);
  assert.match(csv, /Harbor & Pine Funeral Service/u);
  assert.doesNotMatch(csv, /Northstar Memorial Care/u);
  assert.match(csv, /reviewer approved/u);
});

test("call task states disclosure and scope boundaries", () => {
  const task = buildCallTask("Example Funeral Home");
  assert.match(task, /AI survey assistant/u);
  assert.match(task, /transcribed/u);
  assert.match(task, /Do not say that anyone has died/u);
  assert.match(task, /Do not make arrangements/u);
});

test("calling context uses the recipient's supported region", () => {
  assert.deepEqual(callingContext("+918437958613"), { region: "IN", locale: "en-IN" });
  assert.deepEqual(callingContext("+12025550141"), { region: "US", locale: "en-US" });
});

test("intent key is stable for the same survey and provider", () => {
  const provider = initialCases[0].provider;
  assert.equal(stableIntentKey(provider), stableIntentKey({ ...provider }));
  assert.match(stableIntentKey(provider), /^opengpl:triangle-2026-v1:/u);
  assert.match(stableIntentKey(provider), /12025550141$/u);
});
