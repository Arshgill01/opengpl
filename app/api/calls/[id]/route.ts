import { NextResponse } from "next/server";
import { getSurveyCall, liveConfiguration } from "@/lib/calle-server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    if (!liveConfiguration().enabled) {
      return NextResponse.json({ error: "Live mode is disabled." }, { status: 403 });
    }
    const { id } = await context.params;
    if (!/^call_[A-Za-z0-9_-]{1,120}$/u.test(id)) {
      return NextResponse.json({ error: "Invalid call id." }, { status: 400 });
    }
    const call = await getSurveyCall(id);
    return NextResponse.json({ call }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The call could not be read.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
