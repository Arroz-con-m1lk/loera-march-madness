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

export async function POST(request: Request, context: RouteContext) {
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

  // 🔍 Get existing bracket
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("brackets")
    .select(`
      id,
      locked,
      submitted,
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

  // 🔒 Ownership check
  if (ownerName.toLowerCase() !== loggedInPlayerName.toLowerCase()) {
    return NextResponse.json(
      { error: "You can only submit your own bracket." },
      { status: 403 }
    );
  }

  // 🔒 Prevent resubmission if already locked
  if (existing.locked || existing.submitted) {
    return NextResponse.json(
      { error: "Bracket already submitted." },
      { status: 403 }
    );
  }

  // 🧠 Normalize + derive champion
  const normalized = normalizeReadablePicks(body.readablePicks);
  const championPick = getChampionPickFromRounds(normalized);

  // 🚨 Basic validation
  if (!championPick) {
    return NextResponse.json(
      { error: "Champion pick is required before submitting." },
      { status: 400 }
    );
  }

  // 🔐 FINAL SUBMIT (this is the important part)
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("brackets")
    .update({
      readable_picks: normalized,
      champion_pick: championPick,
      submitted: true,
      locked: true, // 🔥 THIS locks the bracket permanently
    })
    .eq("id", id)
    .select(`
      id,
      label,
      bracket_name,
      image_url,
      submitted,
      locked,
      champion_pick
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
    ok: true,
    id: updated.id,
    label: updated.label || updated.bracket_name || "Unnamed Bracket",
    submitted: true,
    locked: true,
    championPick: updated.champion_pick,
  });
}