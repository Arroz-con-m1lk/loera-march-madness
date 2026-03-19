import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getLoggedInPlayerName(request: NextRequest) {
  return request.cookies.get("loera_player_name")?.value?.trim() || "";
}

export async function POST(request: NextRequest, context: RouteContext) {
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

  const { data: existing, error: fetchError } = await supabaseAdmin
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
      { error: "You can only submit your own bracket." },
      { status: 403 }
    );
  }

  if (existing.locked) {
    return NextResponse.json(
      { error: "Bracket is already locked." },
      { status: 403 }
    );
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("brackets")
    .update({
      submitted: true,
      locked: true,
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
      { error: "Submit failed." },
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
    readablePicks: Array.isArray(updated.readable_picks)
      ? updated.readable_picks
      : [],
  });
}