# OpenGPL Product Brief

Status: build thesis selected; direct stakeholder validation pending

## One sentence

OpenGPL helps nonprofit funeral consumer advocates collect, qualify, and review
funeral price information without making volunteers manually repeat every
outreach call.

## User and problem

The initial user is a Funeral Consumers Alliance affiliate or similar consumer
advocacy group. These organizations assemble local funeral price comparisons
using public license lists, websites, email, phone calls, and sometimes in-person
visits.

The work is repetitive but not mechanically simple:

- a provider may answer, transfer, ask for a callback, or not respond;
- the quoted value may be exact, a range, an estimate, or a package;
- required fees and inclusions may be omitted unless asked;
- a phone quote may disagree with the provider's General Price List; and
- only a human reviewer should decide what becomes public survey data.

## MVP workflow

1. Import a CSV of provider name, public business number, locality, and survey
   authorization status.
2. Create a durable outreach intent with one provider, one survey version, one
   approved call window, and one idempotency key.
3. Preview the exact AI disclosure, questions, result schema, and redacted
   destination before approval.
4. Place the CALL-E call at runtime.
5. Reconcile the terminal result through webhook plus authenticated status read.
6. Classify each answer as exact, estimate, range, package, not provided,
   callback required, or unknown.
7. Cross-check structured fields against CALL-E evidence and transcript turns.
8. Send missing, contradictory, or low-confidence results to human review.
9. Export only reviewer-approved rows, retaining the source type and observation
   date.

## Call scope

The first survey asks only for:

- basic services fee;
- immediate burial price excluding the casket;
- direct cremation price including the least-expensive permitted container;
- whether each value is exact, an estimate, a range, or a package;
- which mandatory fees are excluded;
- whether a current General Price List is available; and
- the approved delivery path for that list.

The agent does not claim a death occurred, provide a deceased person's details,
make arrangements, negotiate, purchase, book, or make compliance accusations.

## Result contract

Every field that could be unclear includes `unknown`. Monetary values are stored
as claimed observations, not truth.

```json
{
  "reach_outcome": "answered | callback | no_answer | refused | unknown",
  "disclosure_outcome": "accepted | declined | unclear",
  "basic_services": {
    "amount_usd": 0,
    "quote_type": "exact | estimate | range | package | not_provided | unknown"
  },
  "immediate_burial": {
    "amount_usd": 0,
    "quote_type": "exact | estimate | range | package | not_provided | unknown",
    "casket_excluded": "yes | no | unknown"
  },
  "direct_cremation": {
    "amount_usd": 0,
    "quote_type": "exact | estimate | range | package | not_provided | unknown",
    "alternative_container_included": "yes | no | unknown"
  },
  "excluded_mandatory_fees_disclosed": "yes | no | unknown",
  "gpl_availability": "phone_only | website | email_offered | pickup | not_offered | unknown",
  "callback_required": "yes | no | unknown"
}
```

The transmitted CALL-E schema may need nullable amounts or a different bounded
shape because the API supports only a subset of JSON Schema. The local review
schema remains stricter than the provider schema.

## Demo narrative

Use three explicitly consenting recipient lines playing realistic provider
outcomes:

1. exact prices with clear inclusions;
2. a package or range that omits a required component; and
3. a callback/refusal or answer that contradicts the extracted result.

In under three minutes, show CSV import, no-call preview, real CALL-E calls,
terminal reconciliation, the evidence gate catching ambiguity, human approval,
and a clean comparison export.

## Safety and legal boundaries

- Demo recipients must explicitly consent before testing.
- Production deployment requires the operator to document its calling basis,
  destination type, applicable federal/state rules, and recording/transcription
  disclosure.
- Identify the caller as an AI survey assistant and the sponsoring organization.
- End immediately on opt-out or disclosure refusal and suppress further calls.
- Call only during the configured business window with a strict attempt cap.
- Never use scraped personal numbers or generated/sequential numbers.
- Never publish recordings or raw transcripts.
- Treat the phone quote as a dated claim; a reviewed GPL is a stronger source.

## Why this can win

- The phone is required by a documented regulatory and operational workflow.
- The user and workload already exist in public nonprofit materials.
- The output is measurable and useful: fewer volunteer calls, more qualified
  observations, and a reviewable survey row.
- CALL-E is used deeply: real batch/outbound execution, structured results,
  webhooks, evidence, transcripts, idempotency, and edge-case handling.
- The demo contains visible conflict and human judgment rather than a perfect
  scripted conversation.

## Kill criteria

Stop or materially change the project if:

- two advocacy organizations say telephone outreach is not useful even as a
  first-pass or follow-up tool;
- a legal review concludes consent cannot be operationalized for the target
  deployment;
- CALL-E rejects the subject matter or cannot reliably return the bounded
  fields after prompt/schema iteration; or
- a materially identical CALL-E submission appears before implementation.
