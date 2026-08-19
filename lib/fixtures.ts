import type { Provider, SurveyCase, SurveyResult, TranscriptTurn } from "./opengpl";

const providers: Provider[] = [
  {
    id: "harbor-pine",
    name: "Harbor & Pine Funeral Service",
    locality: "Durham, NC",
    phone: "+12025550141",
    authorization: "demo_only",
    authorizationNote: "Fictional provider. Reserved test number; simulation only.",
    queueState: "needs_review"
  },
  {
    id: "northstar-memorial",
    name: "Northstar Memorial Care",
    locality: "Chapel Hill, NC",
    phone: "+12025550167",
    authorization: "demo_only",
    authorizationNote: "Fictional provider. Reserved test number; simulation only.",
    queueState: "needs_review"
  },
  {
    id: "cedar-crossing",
    name: "Cedar Crossing Funeral Home",
    locality: "Raleigh, NC",
    phone: "+12025550193",
    authorization: "demo_only",
    authorizationNote: "Fictional provider. Reserved test number; simulation only.",
    queueState: "follow_up"
  },
  {
    id: "oakline-services",
    name: "Oakline Mortuary Services",
    locality: "Cary, NC",
    phone: "+12025550128",
    authorization: "not_authorized",
    authorizationNote: "Public business listing imported; outreach authorization not recorded.",
    queueState: "ready"
  }
];

const completeResult: SurveyResult = {
  reachOutcome: "answered",
  disclosureOutcome: "accepted",
  basicServices: { amountUsd: 2495, quoteType: "exact" },
  immediateBurial: { amountUsd: 3190, quoteType: "exact", casketExcluded: "yes" },
  directCremation: { amountUsd: 1295, quoteType: "exact", alternativeContainerIncluded: "yes" },
  excludedMandatoryFeesDisclosed: "yes",
  gplAvailability: "email_offered",
  callbackRequired: "no",
  evidenceSummary: "The provider gave three exact prices, clarified inclusions, and offered to email the current GPL."
};

const rangeResult: SurveyResult = {
  reachOutcome: "answered",
  disclosureOutcome: "accepted",
  basicServices: { amountUsd: 2800, quoteType: "package" },
  immediateBurial: { amountUsd: 3600, quoteType: "range", casketExcluded: "unknown" },
  directCremation: { amountUsd: 1495, quoteType: "exact", alternativeContainerIncluded: "unknown" },
  excludedMandatoryFeesDisclosed: "unknown",
  gplAvailability: "website",
  callbackRequired: "no",
  evidenceSummary: "The representative described a package and a range, but did not confirm the requested exclusions and container inclusion."
};

const contradictionResult: SurveyResult = {
  reachOutcome: "answered",
  disclosureOutcome: "accepted",
  basicServices: { amountUsd: 2275, quoteType: "exact" },
  immediateBurial: { amountUsd: 3450, quoteType: "exact", casketExcluded: "yes" },
  directCremation: { amountUsd: 1095, quoteType: "exact", alternativeContainerIncluded: "yes" },
  excludedMandatoryFeesDisclosed: "yes",
  gplAvailability: "email_offered",
  callbackRequired: "yes",
  evidenceSummary: "CALL-E extracted three exact prices, but the representative asked to call back and did not state all three values."
};

const clearTranscript: TranscriptTurn[] = [
  { offsetSeconds: 0, speaker: "assistant", text: "Hello. I am an AI survey assistant calling for a nonprofit funeral price survey. This call may be transcribed for review. Is it okay to continue?" },
  { offsetSeconds: 9, speaker: "provider", text: "Yes, that is fine." },
  { offsetSeconds: 14, speaker: "assistant", text: "What is your basic services fee?" },
  { offsetSeconds: 18, speaker: "provider", text: "It is exactly $2,495." },
  { offsetSeconds: 27, speaker: "provider", text: "Immediate burial is $3,190 excluding the casket. Direct cremation is $1,295 and includes our least-expensive alternative container." },
  { offsetSeconds: 45, speaker: "provider", text: "Those are exact prices. There are no other mandatory fees for those options. I can email the current General Price List." }
];

const ambiguousTranscript: TranscriptTurn[] = [
  { offsetSeconds: 0, speaker: "assistant", text: "Hello. I am an AI survey assistant calling for a nonprofit funeral price survey. This call may be transcribed for review. May I continue?" },
  { offsetSeconds: 8, speaker: "provider", text: "Sure." },
  { offsetSeconds: 14, speaker: "provider", text: "Our standard package starts around $2,800." },
  { offsetSeconds: 23, speaker: "provider", text: "Immediate burial usually runs from $3,600 to $4,200, depending on what is needed." },
  { offsetSeconds: 35, speaker: "provider", text: "Direct cremation is $1,495. The General Price List is on our website." },
  { offsetSeconds: 43, speaker: "assistant", text: "Does that include the least-expensive permitted container, and are any mandatory fees excluded?" },
  { offsetSeconds: 50, speaker: "provider", text: "The website has the details." }
];

const callbackTranscript: TranscriptTurn[] = [
  { offsetSeconds: 0, speaker: "assistant", text: "Hello. I am an AI survey assistant calling for a nonprofit funeral price survey. This call may be transcribed for review. Is it okay to continue?" },
  { offsetSeconds: 10, speaker: "provider", text: "You can ask, but our director handles the prices." },
  { offsetSeconds: 18, speaker: "provider", text: "I know our basic services fee is $2,275. You will need to call back tomorrow for everything else." }
];

export const initialCases: SurveyCase[] = [
  {
    provider: providers[0],
    observedAt: "2026-08-18T15:42:00.000Z",
    callId: "demo_call_clear",
    callStatus: "completed",
    confidence: 0.94,
    result: completeResult,
    transcript: clearTranscript,
    reviewDecision: "unreviewed",
    reviewerNote: ""
  },
  {
    provider: providers[1],
    observedAt: "2026-08-18T16:08:00.000Z",
    callId: "demo_call_ambiguous",
    callStatus: "completed",
    confidence: 0.73,
    result: rangeResult,
    transcript: ambiguousTranscript,
    reviewDecision: "unreviewed",
    reviewerNote: ""
  },
  {
    provider: providers[2],
    observedAt: "2026-08-19T13:15:00.000Z",
    callId: "demo_call_callback",
    callStatus: "completed",
    confidence: 0.88,
    result: contradictionResult,
    transcript: callbackTranscript,
    reviewDecision: "follow_up",
    reviewerNote: "Director callback required. Extracted immediate burial and cremation prices are unsupported."
  },
  {
    provider: providers[3],
    observedAt: null,
    callId: null,
    callStatus: "not_started",
    confidence: null,
    result: null,
    transcript: [],
    reviewDecision: "unreviewed",
    reviewerNote: ""
  }
];

export function simulatedCase(provider: Provider): SurveyCase {
  const template = provider.id.includes("northstar") ? initialCases[1] : provider.id.includes("cedar") ? initialCases[2] : initialCases[0];
  return {
    ...template,
    provider,
    observedAt: new Date().toISOString(),
    callId: `sim_${provider.id}_${Date.now()}`,
    reviewDecision: "unreviewed",
    reviewerNote: ""
  };
}
