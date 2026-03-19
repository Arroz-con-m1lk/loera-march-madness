import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  PickRound,
  normalizeReadablePicks,
  getChampionPickFromRounds,
} from "@/lib/bracketRounds";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getLoggedInPlayerName(request: Request) {
  return request.cookies.get("loera_player_name")?.value?.trim() || "";
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const loggedInPlayerName = getLoggedInPlayerName(request);

  if (!id) {
    return NextResponse.json(
      { error: "Bracket id is required." },
      { status: 400 }
    );
  }

  if (!loggedInPlayerName) {
    return NextResponse.json(
      { error: "You must be logged in." },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("brackets")
    .select(`
      id,
      label,
      bracket_name,
      image_url,
      paid,
      submitted,
      locked,
      score,
      champion_alive,
      champion_pick,
      readable_picks,
      players ( name )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Bracket not found." },
      { status: 404 }
    );
  }

  const player = Array.isArray(data.players) ? data.players[0] : data.players;
  const ownerName = player?.name?.trim() || "";

  if (ownerName.toLowerCase() !== loggedInPlayerName.toLowerCase()) {
    return NextResponse.json(
      { error: "You can only access your own bracket." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    id: data.id,
    label: data.label || data.bracket_name || "Unnamed Bracket",
    playerName: ownerName,
    image: data.image_url || undefined,
    paid: !!data.paid,
    submitted: !!data.submitted,
    locked: !!data.locked,
    score: data.score ?? 0,
    championAlive: data.champion_alive ?? true,
    championPick: data.champion_pick ?? null,
    readablePicks: normalizeReadablePicks(data.readable_picks as PickRound[]),
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const loggedInPlayerName = getLoggedInPlayerName(request);

  if (!id) {
    return NextResponse.json(
      { error: "Bracket id is required." },
      { status: 400 }
    );
  }

  if (!loggedInPlayerName) {
    return NextResponse.json(
      { error: "You must be logged in." },
      { status: 401 }
    );
  }

  let body: {
    readablePicks?: PickRound[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("brackets")
    .select(`
      id,
      locked,
      champion_pick,
      readable_picks,
      players ( name )
    `)
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { error: fetchError.message },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json(
      { error: "Bracket not found." },
      { status: 404 }
    );
  }

  const player = Array.isArray(existing.players)
    ? existing.players[0]
    : existing.players;

  const ownerName = player?.name?.trim() || "";

  if (ownerName.toLowerCase() !== loggedInPlayerName.toLowerCase()) {
    return NextResponse.json(
      { error: "You can only edit your own bracket." },
      { status: 403 }
    );
  }

  if (existing.locked) {
    return NextResponse.json(
      { error: "Bracket is locked." },
      { status: 403 }
    );
  }

  const normalized = normalizeReadablePicks(body.readablePicks);

  const championPick = getChampionPickFromRounds(normalized);

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("brackets")
    .update({
      readable_picks: normalized,
      champion_pick: championPick,
    })
    .eq("id", id)
    .select(`
      id,
      label,
      bracket_name,
      image_url,
      paid,
      submitted,
      locked,
      score,
      champion_alive,
      champion_pick,
      readable_picks,
      players ( name )
    `)
    .maybeSingle();

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  if (!updated) {
    return NextResponse.json(
      { error: "Update failed." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: updated.id,
    label: updated.label || updated.bracket_name || "Unnamed Bracket",
    playerName: ownerName,
    image: updated.image_url || undefined,
    paid: !!updated.paid,
    submitted: !!updated.submitted,
    locked: !!updated.locked,
    score: updated.score ?? 0,
    championAlive: updated.champion_alive ?? true,
    championPick: updated.champion_pick ?? null,
    readablePicks: normalizeReadablePicks(
      updated.readable_picks as PickRound[]
    ),
  });
}