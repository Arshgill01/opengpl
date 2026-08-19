export type Authorization = "authorized" | "demo_only" | "not_authorized";
export type QueueState = "ready" | "needs_review" | "follow_up" | "approved";
export type QuoteType = "exact" | "estimate" | "range" | "package" | "not_provided" | "unknown";
export type ReviewDecision = "unreviewed" | "approved" | "follow_up";

export type Provider = {
  id: string;
  name: string;
  locality: string;
  phone: string;
  authorization: Authorization;
  authorizationNote: string;
  queueState: QueueState;
};

export type TranscriptTurn = {
  offsetSeconds: number;
  speaker: "assistant" | "provider" | "unknown";
  text: string;
};

export type SurveyResult = {
  reachOutcome: "answered" | "callback" | "no_answer" | "refused" | "unknown";
  disclosureOutcome: "accepted" | "declined" | "unclear";
  basicServices: { amountUsd: number; quoteType: QuoteType };
  immediateBurial: { amountUsd: number; quoteType: QuoteType; casketExcluded: "yes" | "no" | "unknown" };
  directCremation: { amountUsd: number; quoteType: QuoteType; alternativeContainerIncluded: "yes" | "no" | "unknown" };
  excludedMandatoryFeesDisclosed: "yes" | "no" | "unknown";
  gplAvailability: "phone_only" | "website" | "email_offered" | "pickup" | "not_offered" | "unknown";
  callbackRequired: "yes" | "no" | "unknown";
  evidenceSummary: string;
};

export type SurveyCase = {
  provider: Provider;
  observedAt: string | null;
  callId: string | null;
  callStatus: string;
  confidence: number | null;
  result: SurveyResult | null;
  transcript: TranscriptTurn[];
  reviewDecision: ReviewDecision;
  reviewerNote: string;
};

export type EvidenceIssue = {
  field: string;
  severity: "review" | "block";
  message: string;
};

export const surveyVersion = "triangle-2026-v1";

export const recipientResultSchema = {
  type: "object",
  required: [
    "reach_outcome",
    "disclosure_outcome",
    "basic_services_amount_usd",
    "basic_services_quote_type",
    "immediate_burial_amount_usd",
    "immediate_burial_quote_type",
    "casket_excluded",
    "direct_cremation_amount_usd",
    "direct_cremation_quote_type",
    "alternative_container_included",
    "excluded_mandatory_fees_disclosed",
    "gpl_availability",
    "callback_required",
    "evidence_summary"
  ],
  properties: {
    reach_outcome: { type: "string", enum: ["answered", "callback", "no_answer", "refused", "unknown"] },
    disclosure_outcome: { type: "string", enum: ["accepted", "declined", "unclear"] },
    basic_services_amount_usd: { type: "number", description: "Quoted amount, or 0 when no usable amount was given." },
    basic_services_quote_type: { type: "string", enum: ["exact", "estimate", "range", "package", "not_provided", "unknown"] },
    immediate_burial_amount_usd: { type: "number", description: "Quoted amount excluding casket, or 0 when unavailable." },
    immediate_burial_quote_type: { type: "string", enum: ["exact", "estimate", "range", "package", "not_provided", "unknown"] },
    casket_excluded: { type: "string", enum: ["yes", "no", "unknown"] },
    direct_cremation_amount_usd: { type: "number", description: "Quoted amount including the least-expensive permitted container, or 0 when unavailable." },
    direct_cremation_quote_type: { type: "string", enum: ["exact", "estimate", "range", "package", "not_provided", "unknown"] },
    alternative_container_included: { type: "string", enum: ["yes", "no", "unknown"] },
    excluded_mandatory_fees_disclosed: { type: "string", enum: ["yes", "no", "unknown"] },
    gpl_availability: { type: "string", enum: ["phone_only", "website", "email_offered", "pickup", "not_offered", "unknown"] },
    callback_required: { type: "string", enum: ["yes", "no", "unknown"] },
    evidence_summary: { type: "string", description: "Short evidence-based summary. Preserve hedges, ranges, and refusals." }
  },
  additionalProperties: false
} as const;

export function buildCallTask(providerName: string, sponsor = "the Triangle Funeral Consumers Alliance") {
  return [
    `Call ${providerName}, a funeral provider, on behalf of ${sponsor}.`,
    "Start by clearly saying you are an AI survey assistant and that the call may be transcribed for price-survey review.",
    "Ask whether they are willing to continue. If they decline, apologize, end the call, and record the refusal. Do not continue the survey.",
    "If they agree, ask for: (1) the basic services fee, (2) immediate burial excluding the casket, and (3) direct cremation including the least-expensive permitted container.",
    "For every amount, ask whether it is exact, an estimate, a range, or part of a package. Ask which mandatory fees are excluded.",
    "Ask whether the current General Price List is available by website, email, pickup, or only by phone.",
    "Do not say that anyone has died. Do not make arrangements, negotiate, purchase, book, accuse, or state that the provider is out of compliance.",
    "If the person asks not to be called, acknowledge the request and end immediately. Preserve uncertainty instead of guessing."
  ].join(" ");
}

function digits(value: number) {
  return String(Math.round(value));
}

function transcriptText(turns: TranscriptTurn[]) {
  return turns.map((turn) => turn.text.toLowerCase().replaceAll(",", "")).join(" ");
}

export function reviewEvidence(result: SurveyResult | null, transcript: TranscriptTurn[], confidence: number | null): EvidenceIssue[] {
  if (!result) return [{ field: "result", severity: "block", message: "CALL-E did not return a schema-valid result." }];

  const issues: EvidenceIssue[] = [];
  const text = transcriptText(transcript);
  if (!transcript.length) issues.push({ field: "transcript", severity: "block", message: "No transcript evidence is available." });
  if (!text.includes("ai") || !text.includes("transcrib")) {
    issues.push({ field: "disclosure", severity: "block", message: "The transcript does not show both AI and transcription disclosure." });
  }
  if (result.disclosureOutcome !== "accepted") {
    issues.push({ field: "disclosure", severity: "block", message: "The provider did not clearly accept the disclosed survey call." });
  }
  if (result.reachOutcome !== "answered") {
    issues.push({ field: "reach_outcome", severity: "block", message: "A completed survey requires an answered call." });
  }
  if (confidence !== null && confidence < 0.8) {
    issues.push({ field: "confidence", severity: "review", message: `CALL-E confidence is ${Math.round(confidence * 100)}%, below the 80% review threshold.` });
  }

  const amounts = [
    ["basic_services", result.basicServices.amountUsd, result.basicServices.quoteType],
    ["immediate_burial", result.immediateBurial.amountUsd, result.immediateBurial.quoteType],
    ["direct_cremation", result.directCremation.amountUsd, result.directCremation.quoteType]
  ] as const;

  for (const [field, amount, quoteType] of amounts) {
    if (amount > 0 && !text.includes(digits(amount))) {
      issues.push({ field, severity: "block", message: `$${amount.toLocaleString("en-US")} is not present in the transcript.` });
    }
    if (["not_provided", "unknown"].includes(quoteType)) {
      issues.push({ field, severity: "review", message: "The quote was not provided or could not be classified." });
    }
  }

  if (result.immediateBurial.casketExcluded !== "yes") {
    issues.push({ field: "immediate_burial", severity: "review", message: "The quote is not confirmed to exclude the casket." });
  }
  if (result.directCremation.alternativeContainerIncluded !== "yes") {
    issues.push({ field: "direct_cremation", severity: "review", message: "The quote is not confirmed to include the least-expensive permitted container." });
  }
  if (result.excludedMandatoryFeesDisclosed !== "yes") {
    issues.push({ field: "excluded_fees", severity: "review", message: "Excluded mandatory fees were not clearly disclosed." });
  }
  return issues;
}

export function maskPhone(phone: string) {
  if (!phone.startsWith("+") || phone.length < 7) return "Invalid number";
  return `${phone.slice(0, 2)} ${"•".repeat(Math.max(phone.length - 6, 3))} ${phone.slice(-4)}`;
}

export function stableIntentKey(provider: Provider) {
  return `opengpl:${surveyVersion}:${provider.id}:${provider.phone.replace(/\D/gu, "")}`;
}

export function parseProviderCsv(input: string): Provider[] {
  const rows = input.trim().split(/\r?\n/u).filter(Boolean).map(parseCsvRow);
  if (rows.length < 2) throw new Error("The CSV needs a header and at least one provider row.");
  const headers = rows[0].map((item) => item.trim().toLowerCase());
  const required = ["name", "locality", "phone", "authorization"];
  for (const header of required) if (!headers.includes(header)) throw new Error(`Missing required column: ${header}`);
  return rows.slice(1).map((row, index) => {
    const value = (key: string) => row[headers.indexOf(key)]?.trim() ?? "";
    const authorization = value("authorization") as Authorization;
    if (!/^\+[1-9]\d{7,14}$/u.test(value("phone"))) throw new Error(`Row ${index + 2} has an invalid E.164 phone number.`);
    if (!["authorized", "demo_only", "not_authorized"].includes(authorization)) throw new Error(`Row ${index + 2} has an invalid authorization value.`);
    return {
      id: `import-${index + 1}-${value("phone").slice(-4)}`,
      name: value("name"),
      locality: value("locality"),
      phone: value("phone"),
      authorization,
      authorizationNote: value("authorization_note") || "Imported operator attestation",
      queueState: "ready" as const
    };
  });
}

function parseCsvRow(line: string) {
  const cells: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      cells.push(value);
      value = "";
    } else value += character;
  }
  cells.push(value);
  return cells;
}

function csvCell(value: string | number) {
  const text = String(value);
  const safe = /^[=+\-@]/u.test(text) ? `'${text}` : text;
  return /[",\r\n]/u.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function exportApprovedCsv(cases: SurveyCase[]) {
  const header = ["provider", "locality", "observed_at", "basic_services", "immediate_burial", "direct_cremation", "source", "review_status"];
  const rows = cases.filter((item) => item.reviewDecision === "approved" && item.result).map((item) => [
    item.provider.name,
    item.provider.locality,
    item.observedAt ?? "",
    item.result?.basicServices.amountUsd ?? "",
    item.result?.immediateBurial.amountUsd ?? "",
    item.result?.directCremation.amountUsd ?? "",
    "phone observation",
    "reviewer approved"
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
