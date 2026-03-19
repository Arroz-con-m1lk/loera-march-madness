import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { data: players, error: playersError } = await supabaseAdmin
    .from("players")
    .select(`
      id,
      name,
      avatar_url,
      status
    `)
    .order("name", { ascending: true });

  if (playersError) {
    return NextResponse.json(
      { error: playersError.message },
      { status: 500 }
    );
  }

  const { data: brackets, error: bracketsError } = await supabaseAdmin
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
      readable_picks
    `)
    .order("created_at", { ascending: true });

  if (bracketsError) {
    return NextResponse.json(
      { error: bracketsError.message },
      { status: 500 }
    );
  }

  const playersWithBrackets = (players ?? []).map((player) => {
    const playerBrackets = (brackets ?? [])
      .filter((bracket) => bracket.player_id === player.id)
      .map((bracket) => ({
        id: bracket.id,
        label:
          bracket.label ||
          bracket.bracket_name ||
          `${player.name} Bracket`,
        image: bracket.image_url || bracket.bracket_url || undefined,
        paid: !!bracket.paid,
        submitted: !!bracket.submitted,
        locked: !!bracket.locked,
        score: bracket.score ?? 0,
        championAlive: bracket.champion_alive ?? true,
        championPick: bracket.champion_pick ?? undefined,
        busted: !!bracket.busted,
        readablePicks: Array.isArray(bracket.readable_picks)
          ? bracket.readable_picks
          : [],
      }));

    const totalScore = playerBrackets.reduce(
      (sum, bracket) => sum + (bracket.score ?? 0),
      0
    );

    const allDead =
      playerBrackets.length > 0 &&
      playerBrackets.every((bracket) => bracket.championAlive === false);

    const paidAny = playerBrackets.some((bracket) => bracket.paid);
    const submittedAny = playerBrackets.some((bracket) => bracket.submitted);

    return {
      id: player.id,
      name: player.name,
      avatarImage: player.avatar_url || undefined,
      mood:
        player.status === "away"
          ? "away"
          : player.status === "legend"
          ? "legend"
          : "online",
      status: player.status ?? "online",
      score: totalScore,
      championAlive: !allDead,
      paid: paidAny,
      submitted: submittedAny,
      brackets: playerBrackets,
    };
  });

  return NextResponse.json({
    players: playersWithBrackets,
    updatedAt: new Date().toISOString(),
  });
}