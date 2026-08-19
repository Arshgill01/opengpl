"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { initialCases, simulatedCase } from "@/lib/fixtures";
import {
  buildCallTask,
  exportApprovedCsv,
  maskPhone,
  parseProviderCsv,
  recipientResultSchema,
  reviewCaseEvidence,
  stableIntentKey,
  type Provider,
  type QueueState,
  type SurveyCase,
  type SurveyResult,
  type TranscriptTurn
} from "@/lib/opengpl";

const storageKey = "opengpl-workbench-v1";
const filters: Array<{ label: string; value: "all" | QueueState }> = [
  { label: "All", value: "all" },
  { label: "Needs review", value: "needs_review" },
  { label: "Follow-up", value: "follow_up" },
  { label: "Approved", value: "approved" }
];

type LiveConfig = { liveEnabled: boolean; allowlistedRecipients: number; defaultMode: string };
type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function quoteType(value: unknown): SurveyResult["basicServices"]["quoteType"] {
  const allowed = ["exact", "estimate", "range", "package", "not_provided", "unknown"];
  return allowed.includes(String(value)) ? String(value) as SurveyResult["basicServices"]["quoteType"] : "unknown";
}

function resultFromSdk(value: unknown): SurveyResult | null {
  if (!isObject(value)) return null;
  const yesNoUnknown = (input: unknown) => ["yes", "no", "unknown"].includes(String(input)) ? String(input) as "yes" | "no" | "unknown" : "unknown";
  const reach = ["answered", "callback", "no_answer", "refused", "unknown"].includes(String(value.reach_outcome)) ? String(value.reach_outcome) as SurveyResult["reachOutcome"] : "unknown";
  const disclosure = ["accepted", "declined", "unclear"].includes(String(value.disclosure_outcome)) ? String(value.disclosure_outcome) as SurveyResult["disclosureOutcome"] : "unclear";
  const availability = ["phone_only", "website", "email_offered", "pickup", "not_offered", "unknown"].includes(String(value.gpl_availability)) ? String(value.gpl_availability) as SurveyResult["gplAvailability"] : "unknown";
  return {
    reachOutcome: reach,
    disclosureOutcome: disclosure,
    basicServices: { amountUsd: readNumber(value.basic_services_amount_usd), quoteType: quoteType(value.basic_services_quote_type) },
    immediateBurial: { amountUsd: readNumber(value.immediate_burial_amount_usd), quoteType: quoteType(value.immediate_burial_quote_type), casketExcluded: yesNoUnknown(value.casket_excluded) },
    directCremation: { amountUsd: readNumber(value.direct_cremation_amount_usd), quoteType: quoteType(value.direct_cremation_quote_type), alternativeContainerIncluded: yesNoUnknown(value.alternative_container_included) },
    excludedMandatoryFeesDisclosed: yesNoUnknown(value.excluded_mandatory_fees_disclosed),
    gplAvailability: availability,
    callbackRequired: yesNoUnknown(value.callback_required),
    evidenceSummary: readString(value.evidence_summary, "No evidence summary returned.")
  };
}

function caseFromSdk(provider: Provider, value: unknown, previous: SurveyCase): SurveyCase {
  if (!isObject(value)) throw new Error("CALL-E returned an invalid call snapshot.");
  const recipients = Array.isArray(value.recipients) ? value.recipients : [];
  const recipient = isObject(recipients[0]) ? recipients[0] : {};
  const attempts = Array.isArray(recipient.attempts) ? recipient.attempts : [];
  const attempt = isObject(attempts.at(-1)) ? attempts.at(-1) as JsonObject : {};
  const rawTurns = Array.isArray(attempt.transcriptTurns) ? attempt.transcriptTurns : [];
  const transcript: TranscriptTurn[] = rawTurns.filter(isObject).map((turn) => ({
    offsetSeconds: readNumber(turn.offsetSeconds),
    speaker: turn.speaker === "bot" ? "assistant" : turn.speaker === "user" ? "provider" : "unknown",
    text: readString(turn.text)
  }));
  const confidence = isObject(value.completionConfidence) ? readNumber(value.completionConfidence.score) : null;
  const callStatus = readString(value.status, "unknown");
  const result = resultFromSdk(recipient.structuredResult);
  return {
    ...previous,
    provider,
    callId: readString(value.id, previous.callId ?? "") || previous.callId,
    callStatus,
    observedAt: readString(value.completedAt) || previous.observedAt,
    confidence,
    result,
    transcript,
    reviewDecision: "unreviewed",
    reviewerNote: "",
    platformSummary: readString(value.summary),
    failureMessage: readString(value.failureMessage)
  };
}

function statusLabel(item: SurveyCase) {
  if (item.reviewDecision === "approved") return "Approved";
  if (item.reviewDecision === "follow_up") return "Follow-up";
  if (item.callStatus === "calling" || item.callStatus === "queued") return "Call in progress";
  if (!item.result) return "Not called";
  return reviewCaseEvidence(item).length ? "Needs review" : "Ready to approve";
}

function money(value: number) {
  return value > 0 ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value) : "Not provided";
}

function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function Workbench() {
  const [cases, setCases] = useState<SurveyCase[]>(initialCases);
  const [selectedId, setSelectedId] = useState(initialCases[1].provider.id);
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mode, setMode] = useState<"simulation" | "live">("simulation");
  const [confirmation, setConfirmation] = useState("");
  const [liveConfig, setLiveConfig] = useState<LiveConfig>({ liveEnabled: false, allowlistedRecipients: 0, defaultMode: "simulation" });
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) setCases(parsed as SurveyCase[]);
      } catch {
        setNotice("The saved local workspace could not be read. Sample data was restored.");
      }
    }
    fetch("/api/config", { cache: "no-store" })
      .then((response) => response.json())
      .then((value: LiveConfig) => setLiveConfig(value))
      .catch(() => setNotice("Live configuration could not be checked. Simulation remains available."));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(cases));
  }, [cases]);

  const selected = cases.find((item) => item.provider.id === selectedId) ?? cases[0];
  const issues = selected ? reviewCaseEvidence(selected) : [];
  const blockingIssues = issues.filter((issue) => issue.severity === "block");
  const approvalNeedsNote = issues.length > 0 && selected.reviewerNote.trim().length < 12;
  const visibleCases = cases.filter((item) => {
    if (filter === "all") return true;
    if (filter === "approved") return item.reviewDecision === "approved";
    if (filter === "follow_up") return item.reviewDecision === "follow_up";
    return item.result !== null && item.reviewDecision === "unreviewed";
  });
  const counts = useMemo(() => ({
    providers: cases.length,
    review: cases.filter((item) => item.result && item.reviewDecision === "unreviewed").length,
    followUp: cases.filter((item) => item.reviewDecision === "follow_up").length,
    approved: cases.filter((item) => item.reviewDecision === "approved").length
  }), [cases]);

  function updateSelected(update: (item: SurveyCase) => SurveyCase) {
    setCases((current) => current.map((item) => item.provider.id === selected.provider.id ? update(item) : item));
  }

  async function runOutreach() {
    if (!selected) return;
    setBusy(true);
    setNotice(null);
    try {
      if (mode === "simulation") {
        updateSelected((item) => ({ ...item, callStatus: "calling" }));
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        setCases((current) => current.map((item) => item.provider.id === selected.provider.id ? simulatedCase(selected.provider) : item));
        setPreviewOpen(false);
        setNotice("Simulation completed. The result is held for evidence review.");
        return;
      }
      const response = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selected.provider, confirmation })
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isObject(payload) || !isObject(payload.call)) {
        throw new Error(isObject(payload) ? readString(payload.error, "CALL-E rejected the request.") : "CALL-E rejected the request.");
      }
      const call = payload.call;
      const callId = readString(call.id);
      updateSelected((item) => ({ ...item, callId, callStatus: readString(call.status, "queued") }));
      setPreviewOpen(false);
      setConfirmation("");
      setNotice("CALL-E accepted the call. Refresh this same call to reconcile its result.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The outreach could not be started.");
    } finally {
      setBusy(false);
    }
  }

  async function refreshCall() {
    if (!selected.callId?.startsWith("call_")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/calls/${encodeURIComponent(selected.callId)}`, { cache: "no-store" });
      const payload: unknown = await response.json();
      if (!response.ok || !isObject(payload) || !isObject(payload.call)) throw new Error(isObject(payload) ? readString(payload.error, "The call could not be read.") : "The call could not be read.");
      updateSelected((item) => caseFromSdk(item.provider, payload.call, item));
      setNotice("The call was reconciled with the authenticated CALL-E status endpoint.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The call could not be refreshed.");
    } finally {
      setBusy(false);
    }
  }

  async function importCsv(file: File) {
    try {
      const providers = parseProviderCsv(await file.text());
      const imported: SurveyCase[] = providers.map((provider) => ({ provider, observedAt: null, callId: null, callStatus: "not_started", confidence: null, result: null, transcript: [], reviewDecision: "unreviewed", reviewerNote: "" }));
      setCases((current) => [...current, ...imported.filter((item) => !current.some((existing) => existing.provider.id === item.provider.id))]);
      setSelectedId(imported[0].provider.id);
      setNotice(`${imported.length} provider${imported.length === 1 ? "" : "s"} imported. No calls were placed.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The CSV could not be imported.");
    }
  }

  if (!selected) return <main className="empty-state"><h1>No providers</h1><p>Import a survey CSV to begin.</p></main>;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">OG</span><span>OpenGPL</span></div>
        <div className="survey-name"><strong>Triangle price survey</strong><span>2026 working file</span></div>
        <div className="topbar-actions">
          <span className={`mode-state ${liveConfig.liveEnabled ? "configured" : ""}`}>{liveConfig.liveEnabled ? "Live path configured" : "Simulation only"}</span>
          <input ref={fileInput} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={(event) => event.target.files?.[0] && void importCsv(event.target.files[0])} />
          <button className="button secondary" onClick={() => fileInput.current?.click()}>Import CSV</button>
          <button className="button primary" onClick={() => setPreviewOpen(true)}>Preview outreach</button>
        </div>
      </header>

      <section className="summary-strip" aria-label="Survey totals">
        <div><strong>{counts.providers}</strong><span>providers</span></div>
        <div><strong>{counts.review}</strong><span>awaiting review</span></div>
        <div><strong>{counts.followUp}</strong><span>follow-up</span></div>
        <div><strong>{counts.approved}</strong><span>approved rows</span></div>
        <button className="text-button" disabled={!counts.approved} onClick={() => downloadFile("opengpl-approved.csv", exportApprovedCsv(cases), "text/csv")}>Export approved CSV</button>
      </section>

      {notice && <div className="notice" role="status"><span>{notice}</span><button aria-label="Dismiss notice" onClick={() => setNotice(null)}>Close</button></div>}

      <div className="workspace">
        <section className="queue-panel" aria-label="Provider queue">
          <div className="queue-header"><h1>Review queue</h1><span>{visibleCases.length} shown</span></div>
          <div className="filter-tabs" role="tablist" aria-label="Filter providers">
            {filters.map((item) => <button key={item.value} role="tab" aria-selected={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}
          </div>
          <div className="provider-list">
            {visibleCases.map((item) => (
              <button key={item.provider.id} className="provider-row" aria-current={selectedId === item.provider.id ? "true" : undefined} onClick={() => setSelectedId(item.provider.id)}>
                <span className="provider-row-main"><strong>{item.provider.name}</strong><span>{item.provider.locality}</span></span>
                <span className={`status-label status-${item.reviewDecision}`}>{statusLabel(item)}</span>
                <span className="provider-row-meta">{item.result ? `${money(item.result.directCremation.amountUsd)} direct cremation` : "No observation"}</span>
              </button>
            ))}
            {!visibleCases.length && <div className="list-empty">No providers match this filter.</div>}
          </div>
        </section>

        <section className="detail-panel" aria-label={`Review ${selected.provider.name}`}>
          <div className="detail-header">
            <div><h2>{selected.provider.name}</h2><p>{selected.provider.locality} <span aria-hidden="true">/</span> {maskPhone(selected.provider.phone)}</p></div>
            <div className="detail-actions">
              {selected.callId?.startsWith("call_") && <button className="button secondary" disabled={busy} onClick={() => void refreshCall()}>Refresh CALL-E</button>}
              <button className="button secondary" onClick={() => setPreviewOpen(true)}>New outreach</button>
            </div>
          </div>

          <div className={`review-gate ${blockingIssues.length ? "blocked" : issues.length ? "warning" : "clear"}`}>
            <div><strong>{blockingIssues.length ? "Approval blocked by evidence" : issues.length ? "Reviewer judgment required" : "Evidence checks passed"}</strong><p>{blockingIssues.length ? `${blockingIssues.length} blocking issue${blockingIssues.length === 1 ? "" : "s"} must be resolved before publication.` : issues.length ? `${issues.length} qualification note${issues.length === 1 ? "" : "s"} remain attached to this observation.` : "The extracted values are present in the transcript and the disclosure is visible."}</p></div>
            <span>{selected.confidence === null ? "No score" : `${Math.round(selected.confidence * 100)}% CALL-E confidence`}</span>
          </div>

          {selected.result ? (
            <>
              <section className="observation-section">
                <div className="section-title"><h3>Extracted observation</h3><span>{selected.observedAt ? new Date(selected.observedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Not observed"}</span></div>
                <div className="price-grid">
                  <PriceField label="Basic services fee" amount={selected.result.basicServices.amountUsd} detail={selected.result.basicServices.quoteType} issue={issues.find((item) => item.field === "basic_services")} />
                  <PriceField label="Immediate burial" amount={selected.result.immediateBurial.amountUsd} detail={`${selected.result.immediateBurial.quoteType}; casket excluded: ${selected.result.immediateBurial.casketExcluded}`} issue={issues.find((item) => item.field === "immediate_burial")} />
                  <PriceField label="Direct cremation" amount={selected.result.directCremation.amountUsd} detail={`${selected.result.directCremation.quoteType}; container included: ${selected.result.directCremation.alternativeContainerIncluded}`} issue={issues.find((item) => item.field === "direct_cremation")} />
                </div>
                <dl className="qualification-list">
                  <div><dt>Excluded mandatory fees</dt><dd>{selected.result.excludedMandatoryFeesDisclosed}</dd></div>
                  <div><dt>GPL availability</dt><dd>{selected.result.gplAvailability.replaceAll("_", " ")}</dd></div>
                  <div><dt>Callback required</dt><dd>{selected.result.callbackRequired}</dd></div>
                </dl>
              </section>

              {issues.length > 0 && <section className="issues-section"><h3>Evidence checks</h3><div className="issue-list">{issues.map((issue, index) => <div className="issue-row" key={`${issue.field}-${index}`}><span>{issue.severity === "block" ? "Block" : "Review"}</span><div><strong>{issue.field.replaceAll("_", " ")}</strong><p>{issue.message}</p></div></div>)}</div></section>}

              <section className="transcript-section">
                <div className="section-title"><h3>Transcript evidence</h3><span>Private review copy</span></div>
                <div className="transcript">{selected.transcript.map((turn, index) => <div className="transcript-turn" key={`${turn.offsetSeconds}-${index}`}><span>{turn.speaker}</span><p>{turn.text}</p><time>{Math.floor(turn.offsetSeconds / 60)}:{String(turn.offsetSeconds % 60).padStart(2, "0")}</time></div>)}</div>
              </section>

              <section className="decision-section">
                <label htmlFor="reviewer-note">Reviewer note</label>
                <textarea id="reviewer-note" value={selected.reviewerNote} placeholder="Record why this observation is safe to publish or what needs follow-up." onChange={(event) => updateSelected((item) => ({ ...item, reviewerNote: event.target.value }))} />
                <div className="decision-actions">
                  <button className="button secondary" onClick={() => updateSelected((item) => ({ ...item, reviewDecision: "follow_up", provider: { ...item.provider, queueState: "follow_up" } }))}>Send to follow-up</button>
                  <button
                    className="button primary"
                    disabled={blockingIssues.length > 0 || approvalNeedsNote || selected.reviewDecision === "approved"}
                    title={blockingIssues.length ? "Resolve blocking evidence issues before approval" : approvalNeedsNote ? "Add a reviewer note before approving an observation with qualifications" : undefined}
                    onClick={() => updateSelected((item) => ({ ...item, reviewDecision: "approved", provider: { ...item.provider, queueState: "approved" } }))}
                  >
                    {selected.reviewDecision === "approved" ? "Approved" : "Approve observation"}
                  </button>
                </div>
              </section>
            </>
          ) : (
            <div className="no-observation"><h3>No phone observation yet</h3><p>Preview the disclosure, questions, destination, and authorization before creating an outreach intent.</p><button className="button primary" onClick={() => setPreviewOpen(true)}>Preview outreach</button></div>
          )}
        </section>
      </div>

      {previewOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setPreviewOpen(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="preview-title">
            <div className="modal-header"><div><h2 id="preview-title">Outreach preview</h2><p>No call is placed until the final action.</p></div><button className="close-button" aria-label="Close preview" onClick={() => setPreviewOpen(false)}>Close</button></div>
            <div className="mode-switch" role="radiogroup" aria-label="Execution mode">
              <button role="radio" aria-checked={mode === "simulation"} onClick={() => setMode("simulation")}><strong>Simulation</strong><span>Fixture result, zero external side effects</span></button>
              <button role="radio" aria-checked={mode === "live"} disabled={!liveConfig.liveEnabled} onClick={() => setMode("live")}><strong>Live CALL-E</strong><span>{liveConfig.liveEnabled ? `${liveConfig.allowlistedRecipients} allowlisted recipient${liveConfig.allowlistedRecipients === 1 ? "" : "s"}` : "Disabled by deployment configuration"}</span></button>
            </div>
            <dl className="preview-facts">
              <div><dt>Destination</dt><dd>{selected.provider.name}<br />{maskPhone(selected.provider.phone)}</dd></div>
              <div><dt>Authorization</dt><dd>{selected.provider.authorization.replaceAll("_", " ")}<br /><span>{selected.provider.authorizationNote}</span></dd></div>
              <div><dt>Intent key</dt><dd><code>{stableIntentKey(selected.provider)}</code></dd></div>
              <div><dt>Result contract</dt><dd>{Object.keys(recipientResultSchema.properties).length} required fields; unknown allowed</dd></div>
            </dl>
            <div className="script-preview"><h3>Exact CALL-E task</h3><p>{buildCallTask(selected.provider.name)}</p></div>
            {mode === "live" && <label className="confirmation-field" htmlFor="confirmation"><span>Type I APPROVE THIS CALL</span><input id="confirmation" autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>}
            <div className="modal-footer"><p>{mode === "simulation" ? "Uses a realistic transcript fixture. It cannot dial a phone." : "A real external call may start immediately and cannot be canceled through CALL-E."}</p><button className="button primary" disabled={busy || (mode === "live" && (confirmation !== "I APPROVE THIS CALL" || selected.provider.authorization !== "authorized"))} onClick={() => void runOutreach()}>{busy ? "Working..." : mode === "simulation" ? "Run simulation" : "Place CALL-E call"}</button></div>
          </section>
        </div>
      )}
    </main>
  );
}

function PriceField({ label, amount, detail, issue }: { label: string; amount: number; detail: string; issue?: { severity: "review" | "block"; message: string } }) {
  return <div className={`price-field ${issue ? `has-${issue.severity}` : ""}`}><span>{label}</span><strong>{money(amount)}</strong><p>{detail.replaceAll("_", " ")}</p>{issue && <em>{issue.message}</em>}</div>;
}
