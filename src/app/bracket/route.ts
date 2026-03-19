import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type BracketUpdatePayload = {
  id?: string;
  label?: string;
  score?: number;
  paid?: boolean;
  submitted?: boolean;
  locked?: boolean;
  busted?: boolean;
  champion_pick?: string | null;
  champion_alive?: boolean;
  image_url?: string | null;
};

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("brackets")
    .select(`
      id,
      player_id,
      bracket_name,
      label,
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
    `)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as BracketUpdatePayload;

    if (!body?.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "Bracket id is required." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.label === "string") {
      updates.label = body.label.trim();
    }

    if (typeof body.score === "number" && Number.isFinite(body.score)) {
      updates.score = body.score;
    }

    if (typeof body.paid === "boolean") {
      updates.paid = body.paid;
    }

    if (typeof body.submitted === "boolean") {
      updates.submitted = body.submitted;
    }

    if (typeof body.locked === "boolean") {
      updates.locked = body.locked;
    }

    if (typeof body.busted === "boolean") {
      updates.busted = body.busted;
    }

    if (
      typeof body.champion_pick === "string" ||
      body.champion_pick === null
    ) {
      updates.champion_pick =
        typeof body.champion_pick === "string"
          ? body.champion_pick.trim()
          : null;
    }

    if (typeof body.champion_alive === "boolean") {
      updates.champion_alive = body.champion_alive;
    }

    if (
      typeof body.image_url === "string" ||
      body.image_url === null
    ) {
      updates.image_url =
        typeof body.image_url === "string"
          ? body.image_url.trim()
          : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid update fields provided." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("brackets")
      .update(updates)
      .eq("id", body.id)
      .select(`
        id,
        player_id,
        bracket_name,
        label,
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
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}