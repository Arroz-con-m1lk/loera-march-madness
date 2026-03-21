import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type LiveAlertRow = {
  id: string;
  message: string;
  type?: string | null;
  entity_key?: string | null;
  player_name?: string | null;
  bracket_label?: string | null;
  score?: number | null;
  created_at?: string | null;
  expires_at?: string | null;
};

export async function GET() {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("live_alerts")
    .select(
      "id, message, type, entity_key, player_name, bracket_label, score, created_at, expires_at"
    )
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const alerts = ((data ?? []) as LiveAlertRow[]).map((alert) => ({
    id: alert.id,
    message: alert.message,
    type: alert.type ?? "general",
    entityKey: alert.entity_key ?? null,
    playerName: alert.player_name ?? null,
    bracketLabel: alert.bracket_label ?? null,
    score: alert.score ?? null,
    createdAt: alert.created_at ?? null,
    expiresAt: alert.expires_at ?? null,
  }));

  return NextResponse.json({
    alerts,
    updatedAt: new Date().toISOString(),
  });
}