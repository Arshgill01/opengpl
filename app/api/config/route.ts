import { NextResponse } from "next/server";
import { liveConfiguration } from "@/lib/calle-server";

export const dynamic = "force-dynamic";

export function GET() {
  const configuration = liveConfiguration();
  return NextResponse.json(
    {
      liveEnabled: configuration.enabled,
      allowlistedRecipients: configuration.allowedNumbers.size,
      defaultMode: "simulation"
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
