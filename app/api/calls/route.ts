import { NextResponse } from "next/server";
import { createSurveyCall } from "@/lib/calle-server";
import type { Authorization, Provider, QueueState } from "@/lib/opengpl";

export const dynamic = "force-dynamic";

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseProvider(value: unknown): Provider {
  if (!isObject(value)) throw new Error("provider is required.");
  const strings = ["id", "name", "locality", "phone", "authorization", "authorizationNote", "queueState"];
  if (!strings.every((key) => typeof value[key] === "string" && value[key])) throw new Error("provider is invalid.");
  if (!/^\+[1-9]\d{7,14}$/u.test(String(value.phone))) throw new Error("provider.phone must be E.164.");
  const authorization = String(value.authorization) as Authorization;
  const queueState = String(value.queueState) as QueueState;
  if (!["authorized", "demo_only", "not_authorized"].includes(authorization)) throw new Error("provider.authorization is invalid.");
  if (!["ready", "needs_review", "follow_up", "approved"].includes(queueState)) throw new Error("provider.queueState is invalid.");
  return {
    id: String(value.id),
    name: String(value.name),
    locality: String(value.locality),
    phone: String(value.phone),
    authorization,
    authorizationNote: String(value.authorizationNote),
    queueState
  };
}

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json." }, { status: 415 });
    }
    const body: unknown = await request.json();
    if (!isObject(body) || body.confirmation !== "I APPROVE THIS CALL") {
      return NextResponse.json({ error: "The exact operator confirmation is required." }, { status: 400 });
    }
    const provider = parseProvider(body.provider);
    const call = await createSurveyCall(provider);
    return NextResponse.json({ call }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The call could not be created.";
    const status = /disabled|allowlist|authorization/u.test(message) ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
