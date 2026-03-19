import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("brackets")
    .select(
      `
      id,
      player_id,
      label,
      bracket_name,
      bracket_url,
      image_url,
      score,
      paid,
      submitted,
      locked,
      busted,
      champion_pick,
      champion_alive,
      created_at,
      players (
        id,
        name,
        avatar_url,
        status
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function PATCH(request: Request) {
  let body: {
    id?: string;
    label?: string;
    image_url?: string;
    score?: number;
    paid?: boolean;
    submitted?: boolean;
    locked?: boolean;
    busted?: boolean;
    champion_pick?: string;
    champion_alive?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (!body.id) {
    return NextResponse.json(
      { error: "Bracket id is required." },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};

  if (body.label !== undefined) updates.label = body.label;
  if (body.image_url !== undefined) updates.image_url = body.image_url;
  if (body.score !== undefined) updates.score = body.score;
  if (body.paid !== undefined) updates.paid = body.paid;
  if (body.submitted !== undefined) updates.submitted = body.submitted;
  if (body.locked !== undefined) updates.locked = body.locked;
  if (body.busted !== undefined) updates.busted = body.busted;
  if (body.champion_pick !== undefined) {
    updates.champion_pick = body.champion_pick;
  }
  if (body.champion_alive !== undefined) {
    updates.champion_alive = body.champion_alive;
  }

  const { data, error } = await supabaseAdmin
    .from("brackets")
    .update(updates)
    .eq("id", body.id)
    .select(
      `
      id,
      player_id,
      label,
      bracket_name,
      bracket_url,
      image_url,
      score,
      paid,
      submitted,
      locked,
      busted,
      champion_pick,
      champion_alive,
      created_at,
      players (
        id,
        name,
        avatar_url,
        status
      )
    `
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Bracket not found or update failed." },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}