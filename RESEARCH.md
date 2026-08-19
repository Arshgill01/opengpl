# CALL-E Hackathon Research and Strategy

Research snapshot: 2026-08-19 (Asia/Kolkata)

The challenge page and schedule publish the project deadline as 2026-09-14 at
21:15 IST, 26 calendar days from this snapshot. The official-rules page instead
says 09:15 IST on the same date. Until the organizer fixes or explains that
12-hour conflict, the internal submission cutoff is **2026-09-13 at 21:00 IST**.
The separate feedback period closes 2026-09-18 at 21:15 IST.

## Executive verdict

Target **Most Practical Use Case** and **Most Valuable Feedback**.

Do not begin with a generic voice-agent concept. Begin with a narrow operational
exception where:

1. the phone is still required because the other party has no reliable API;
2. delay has a measurable cost;
3. a call produces a small, verifiable state transition;
4. an ambiguous answer can safely go to a human; and
5. we can interview at least three real operators before committing.

The selected build thesis is **OpenGPL**, a consent-first phone-outreach and
evidence-review tool for nonprofit funeral consumer advocates conducting price
transparency surveys. The initial user is not a grieving family. It is the
volunteer organization doing the difficult work of collecting comparable price
information before families need it.

This is independently discoverable and testable without pretending we already
have a customer. Funeral Consumers Alliance affiliates publish their survey
methods, results, workload, volunteer needs, and organization contact channels.
The live demo will use owned or explicitly consenting recipient lines; outreach
to a real affiliate requires separate approval.

## What CALL-E actually is

CALL-E is a young outbound calling platform. Its public integration repository
was created on 2026-04-10; the community repository followed on 2026-05-08 and
the developer-docs repository on 2026-07-17. The current contest opened on
2026-07-23. I found no evidence of an earlier CALL-E hackathon or a prior set of
CALL-E winners. This is an evidence-of-absence statement, not proof that no
private event occurred.

Primary sources:

- [Contest and judging criteria](https://call-e.devpost.com/)
- [CALL-E integrations and capability table](https://github.com/CALLE-AI/call-e-integrations)
- [Community submission repository](https://github.com/CALLE-AI/awesome-phone-call-agents)
- [Developer API documentation](https://github.com/CALLE-AI/calle-docs)

The current platform supports:

- one-recipient and batch outbound call tasks;
- schema-validated task-level and recipient-level results;
- transcripts, summaries, evidence, confidence, and attempt records;
- polling, events, terminal webhooks, metadata, and idempotency keys;
- local calling in India, including English and Hindi; and
- handling of voicemail, screening, holds, transfers, silence, and
  interruptions.

The integrating app—not CALL-E—must own authorization, workflow state,
idempotency, retry policy, reconciliation, evidence checks, human review, and
audit history. CALL-E's advertised multi-step, goal-driven long tasks are still
in development. Any winning multi-step workflow must therefore orchestrate
those steps itself. The repository's new
[production workflow guide](https://github.com/CALLE-AI/awesome-phone-call-agents/blob/main/docs/production-workflows.md)
is the clearest statement of this boundary.

## Competition already visible

The official page had more than 2,200 registered participants when reviewed.
The public contribution repository already had 147 pull requests: 93 merged,
45 open, and 9 closed without merge. The unpublished Devpost gallery is not a
useful collision check; the GitHub pull requests are.

Already crowded in this contest or adjacent voice-agent competitions:

| Cluster | Examples already visible | Decision |
| --- | --- | --- |
| Reception and lead follow-up | AI front desk, missed-call recovery, lead booking, quote follow-up | Avoid |
| Appointment and attendance | appointment reminders, no-show guard, clinic booking, treatment attendance | Avoid |
| Health and elder check-ins | maternal health follow-up, caregiver calls, wellness and elder companions | Avoid unless we have exceptional domain access |
| Logistics and field service | cold-chain resolution, parcel exceptions, dispatch verification, HVAC closeout, site-visit recovery | Avoid |
| Alerts and escalation | critical alerts, incident ops, on-call acknowledgment | Avoid |
| Verification | phone claim verification, research gap verification, contact proof, scam screening | Avoid |
| Supplier and inventory recovery | quote chasing, capacity recovery, pharmacy/clinic stock, auto parts | Avoid |
| Generic consumer concierge | restaurant calls, travel recovery, local-business lookup | Avoid |

Some initially attractive ideas fail a real collision test:

- Auto-parts sourcing is a real pain—one trade source reports as many as ten
  calls for one estimate—but direct products such as Part Scout AI already make
  supplier calls, and a similar hackathon project exists. See
  [FenderBender](https://www.fenderbender.com/running-a-shop/operations/article/33020372/parts-procurement-is-next-bastion-of-change).
- Urgent home-care shift filling is painful, but Phoebe, HappyShift, Caribou,
  and others already call or text qualified caregivers.
- Accounts-receivable calling and dispute triage is a mature voice-agent
  category.
- Substitute-teacher call cascades have existed in absence-management systems
  for years.
- COI and lien-waiver chasing is valuable, but managed vendors already make
  live calls and newer AI products explicitly chase compliance documents.

## What similar winners teach us

| Event / winner | What it did | Transferable lesson |
| --- | --- | --- |
| [Vapi Build Challenge 2025](https://vapi.ai/blog/meet-the-winners-of-the-vapi-build-challenge-2025) — Talvin | Production recruiting workflow | Existing use and precise workflow beat a speculative demo. |
| Vapi — FROSTai | Hands-free support for technicians in the field | Voice wins when hands and attention are unavailable. |
| Vapi — Jiffly | Finds and books local services through calls | A call must end in a transaction or next step, not a summary. |
| Retell community winner — property maintenance dispatcher | Voice triage, identity, photo intake, diagnosis, dispatch | Judges reward a complete lifecycle with visible state and integrations. |
| [ElevenLabs Worldwide Hackathon](https://elevenlabs.io/blog/announcing-the-winners-of-the-elevenlabs-worldwide-hackathon) — GibberLink | Agents detect one another and switch to machine audio | Innovation winners need a memorable technical reveal, not merely a new vertical. |
| YC Call My Agent — Chief (third overall) | Listens during a high-stakes call and prepares side actions | The best agent stays out of the way and acts at the moment of leverage. |
| HackUTD 2024 — TalkTuahBank | Phone-accessible banking assistant | Accessibility and reach can make the phone essential rather than decorative. |
| Berkeley AI Hackathon — DispatchAI | Live voice triage plus an operator cockpit | High-impact demos pair the conversation with a serious human interface. |

The convergent pattern is **closed-loop work**:

```text
business event -> authorized call -> structured evidence -> policy gate
               -> visible next action -> human review or safe transition
```

“Natural conversation” is table stakes. The product is the workflow around the
call.

## Opportunity filter

Score every candidate from 1–5 on the following before implementation:

| Criterion | Weight | Kill condition |
| --- | ---: | --- |
| Specific real user pain | 25% | No operator can show the current workflow |
| Phone is structurally necessary | 20% | A portal/API is normally faster and reliable |
| Measurable outcome | 15% | Success is only “helpful conversation” |
| Safe bounded failure | 15% | A wrong result can cause irreversible harm without review |
| Collision / novelty | 10% | Same workflow is already in the CALL-E PR queue |
| Three-minute demo clarity | 10% | The payoff is invisible or needs long explanation |
| Reusability | 5% | Only works for one scripted demo recipient |

## Candidate directions after the collision pass

These are hypotheses, not product commitments.

### Selected: OpenGPL — funeral price survey outreach and evidence review

Funeral consumer advocates already perform this work. Funeral Consumers
Alliance North Carolina reports that 19 volunteers worked from a list of more
than 750 licensed funeral homes, checking websites, emailing, making repeated
follow-up calls, and sometimes visiting in person. The South Carolina affiliate
also publishes a focused telephone survey covering basic services, immediate
burial, and direct cremation.

The FTC's 2024 staff study reviewed calls to 278 funeral providers. It could not
obtain price information from 21 providers during business hours, needed
multiple calls or a callback for about 30%, received estimates or ranges from
half, and found inconsistent quotes from at least 37 providers. FTC Opinion
09-2 also confirms that providers must give telephone price information to
anyone who asks, including a business using the data for profit.

OpenGPL does not pretend a phone quote is a General Price List. It records the
source and quality of each claim—exact phone quote, estimate, range, package,
refusal, callback, or GPL document—and refuses to publish ambiguous or
contradictory data without human review.

Primary evidence:

- [FCA price survey best practices](https://www.funerals.org/affiliate-resources/running-affiliate/price-survey-best-practices/)
- [North Carolina 2025–2026 survey workload](https://www.funeralsnc.org/price-survey/)
- [South Carolina focused phone survey](https://www.scfuneralconsumers.org/price-surveys.html)
- [FTC staff phone-sweep findings](https://www.ftc.gov/news-events/news/press-releases/2024/11/ftc-staff-issues-report-undercover-funeral-rule-phone-sweep)
- [FTC Opinion 09-2](https://www.ftc.gov/legal-library/browse/advisory-opinions/opinion-09-2)

The collision search found no funeral, cremation, bereavement, or GPL workflow
in the current CALL-E pull requests or issues. Existing funeral voice products
are mainly inbound receptionists for funeral homes; online comparison products
do not appear to automate this nonprofit phone-survey workflow. This is a
strong whitespace signal, not proof that no private competitor exists.

Risks:

- The FCC treats AI-generated voices as artificial voices under the TCPA.
  Production outreach needs a documented legal basis and destination policy;
  the hackathon demo must use explicitly consenting recipients.
- FCA's best-practices guide warns that full telephone surveys can miss hidden
  fees and legal disclosures. OpenGPL must label phone quotes correctly and
  treat received GPL documents as the stronger source.
- The app must not impersonate a bereaved person, make arrangements, negotiate,
  accuse a provider of noncompliance, or publish private transcripts.

### Backup 1. Permit and inspection exception desk

Trigger: a permit review or inspection misses an expected date, has an unclear
status, or appears blocked.

The app makes one disclosed, authorized call to obtain a bounded fact such as
the current stage, missing item, responsible desk, available inspection window,
or promised follow-up date. It stores the transcript-backed result, detects
contradictions, and proposes a next action for a human.

Why it survives the first pass:

- contractors publicly describe fragmented agencies, inconsistent answers,
  missed review dates, and unreturned messages;
- government technology mostly reduces inbound calls for the authority; the
  contractor-side exception workflow remains fragmented;
- a status/blocker/date is a compact structured result; and
- the app can never approve construction or represent an official decision.

Risks: public-office calling must be legitimate and disclosed; some cities have
excellent portals; office hours make demos brittle; government staff should not
be used as involuntary test subjects.

Evidence:

- [Contractors challenge permit communication and consistency](https://keysweekly.com/42/marathon-contractors-demand-accountability-in-permits-workshop/)
- [Seattle construction permitting audit](https://seattle.gov/documents/Departments/CityAuditor/auditreports/ConstructionPermittingAudit_final.pdf)
- [Orange County reduced calls with digital permitting](https://www.govtech.com/gov-experience/ai-helped-orange-county-fla-halve-permitting-calls)

### Backup 2. Veterinary referral capacity coordinator — high value, high safety cost

Trigger: a general-practice vet needs a specialty or emergency transfer and must
confirm whether a receiving hospital can accept it.

The call would only collect availability, service, intake route, and a human
contact; it must not triage, diagnose, or direct the owner. A veterinarian makes
the final decision.

Why it is interesting: referral hospitals explicitly ask clinics to call before
transfer, availability is dynamic, and most current veterinary voice products
focus on inbound reception rather than hospital-to-hospital coordination.

Why it may be a bad hackathon choice: a failed call can delay care, realistic
testing is difficult, and domain access is mandatory.

Evidence:

- [Veterinary emergency referral workflow](https://www.cliniciansbrief.com/article/emergency-primary-care-veterinarian-referral)
- [AAHA referral guidelines](https://pages.aaha.org/hubfs/Guidelines%20PDFs/2025%20Referral%20Guidelines/toolkit/ReferralGL_Toolkit.pdf)

### Backup 3. Animal-rescue foster dispatch — useful, safer, weaker commercial case

Trigger: an authorized rescue coordinator needs to place an animal with a
pre-consented foster roster under a deadline.

The system ranks only eligible volunteers, calls in a bounded sequence, records
availability and constraints, stops at the first provisional match, and leaves
placement approval with the coordinator.

This has genuine nonprofit value and a clear call cascade, but adjacent dispatch
patterns are common and the $4,000 practical category may favor a workflow with
clearer economic ROI.

Evidence:

- [Animal rescue still relies on phone trees and scattered tools](https://rescueforce.org/what-we-do.html)
- [Foster coordination at scale](https://humanepro.org/magazine/articles/career-spotlight-foster-care-coordinator)

## Provisional product shape

Whatever vertical wins validation, build the same thin, serious spine:

1. **Intent record** — exact authorized purpose, recipient, expiry, schema and
   idempotency key.
2. **No-call preview** — redacted task, data to be sent, expected fields and
   explicit approval.
3. **CALL-E dispatch** — SDK/API call at runtime, not a mocked reference.
4. **Result inbox** — webhook plus authenticated reconciliation.
5. **Evidence gate** — structured result cross-checked against evidence and
   transcript; `unknown` is first-class.
6. **Human decision** — apply, retry manually, or close with reason.
7. **Audit timeline** — enough to explain the transition without leaking phone
   numbers or transcripts.
8. **Dry-run fixtures** — every demo state works without credentials or calls.

This scope is more credible than building a general workflow engine.

## Feedback-prize strategy

Feedback prizes in comparable developer-platform contests are awarded for
complete, actionable input across APIs, documentation, UI, integrations, and
runtime behavior—not for a vague feature wishlist. A Serverpod feedback winner,
for example, covered infrastructure transparency, scaling, WebSocket behavior,
and GDPR concerns after shipping a project:
[winner announcement](https://serverpod.dev/blog/flutter-butler).

Use the 20 included calls as a predeclared test matrix, not random debugging:

| Dimension | Cases |
| --- | --- |
| Reachability | answered, no answer, airplane/offline, rejected, voicemail |
| Conversation | clear yes/no, ambiguous answer, correction, interruption, silence |
| Routing | IVR, hold, transfer, wrong person |
| Extraction | enum with `unknown`, required field missing, batch recipient result |
| Reliability | client timeout, idempotent replay, webhook replay, polling restart |
| Locale | Indian English and Hindi on owned/authorized lines |

For every finding, retain privately: API/SDK version, time, masked region,
request shape, idempotency key, call ID, event sequence, expected behavior,
actual behavior, impact, workaround, and suggested acceptance criteria. Search
existing issues first and do not publish private numbers or transcripts.

Current public issues already cover several obvious bugs, including
[structured results contradicting transcript evidence](https://github.com/CALLE-AI/awesome-phone-call-agents/issues/181),
[a call starting after the create request times out](https://github.com/CALLE-AI/awesome-phone-call-agents/issues/150),
and [multiple real outcomes collapsing into `DECLINED`](https://github.com/CALLE-AI/awesome-phone-call-agents/issues/195).
Repeating those reports will not be valuable. Testing should focus on the chosen
workflow's real edge cases and on gaps not already reported.

## Research method and confidence

Across both discovery passes, Exa was used to review 807 search results across
eight workstreams: CALL-E history and platform, adjacent winners, operational
pain, competitor collision, feedback awards, independently testable consumer
workflows, focused funeral-market validation, and potential nonprofit design
partners. The seven structured search batches contained 797 results,
deduplicated to 686 unique URLs. Primary platform, regulator, nonprofit, and
practitioner sources were weighted above generic vendor roundups. Search
results were used for discovery, then high-value claims were checked against
official pages, repositories, rules, API schemas, or direct industry sources.

Confidence is high on CALL-E's public API surface and current repository
competition; medium on market whitespace; and deliberately low on willingness
to pay until operator interviews happen.

## Immediate decision gate

The no-call tracer bullet exists so operators have something concrete to
criticize. Do not expand it into a production service until OpenGPL passes these
tests:

- three operator interviews;
- one real workflow artifact (spreadsheet, ticket, call log, checklist, or
  anonymized example);
- five recent cases with frequency, duration, and consequence;
- permission to run a small disclosed call test or a credible simulated
  recipient setup; and
- no duplicate workflow found in the CALL-E pull requests immediately before
  implementation.
