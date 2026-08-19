import "server-only";

import { CalleClient } from "@call-e/calle";
import { buildCallTask, callingContext, recipientResultSchema, stableIntentKey, type Provider } from "./opengpl";

const liveMode = "operator-prototype";

export function liveConfiguration() {
  const allowedNumbers = new Set(
    (process.env.OPENGPL_ALLOWED_NUMBERS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
  return {
    enabled: process.env.OPENGPL_LIVE_MODE === liveMode && Boolean(process.env.CALLE_API_KEY) && allowedNumbers.size > 0,
    allowedNumbers
  };
}

function client() {
  const apiKey = process.env.CALLE_API_KEY;
  if (!apiKey) throw new Error("CALLE_API_KEY is not configured.");
  return new CalleClient({ apiKey });
}

export async function createSurveyCall(provider: Provider) {
  const configuration = liveConfiguration();
  if (!configuration.enabled) throw new Error("Live mode is disabled.");
  if (!configuration.allowedNumbers.has(provider.phone)) throw new Error("This number is not in the deployment allowlist.");
  if (provider.authorization !== "authorized") throw new Error("The provider does not have recorded call authorization.");

  const webhookUrl = process.env.OPENGPL_WEBHOOK_URL;
  if (webhookUrl && !webhookUrl.startsWith("https://")) throw new Error("OPENGPL_WEBHOOK_URL must use HTTPS.");

  const { region, locale } = callingContext(provider.phone);

  return client().calls.create(
    {
      task: buildCallTask(provider.name),
      recipients: [{ phones: [provider.phone], region, locale }],
      recipientResultSchema,
      metadata: {
        workflow: "opengpl",
        provider_id: provider.id,
        survey_version: "triangle-2026-v1"
      },
      ...(webhookUrl ? { webhookUrl } : {})
    },
    { idempotencyKey: stableIntentKey(provider) }
  );
}

export async function getSurveyCall(callId: string) {
  return client().calls.get(callId);
}
