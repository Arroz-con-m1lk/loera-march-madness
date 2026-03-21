import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBracketScore } from "@/lib/scoreBracket";
import {
  normalizeReadablePicks,
  type PickRound,
} from "@/lib/bracketRounds";
import { teamsMatch } from "@/lib/normalizeTeamName";

type ResultsRow = {
  id: string;
  label: string;
  readable_results: PickRound[] | null;
  updated_at?: string | null;
};

function getChampionAliveFromResults(
  championPick: string | null | undefined,
  results: PickRound[]
) {
  const pick = (championPick ?? "").trim();
  if (!pick) return true;

  const normalized = normalizeReadablePicks(results);
  const hasAnyResults = normalized.some((round) =>
    round.teams.some((team) => team.trim().length > 0)
  );

  if (!hasAnyResults) return true;

  const appearsInResults = normalized.some((round) =>
    round.teams.some((team) => teamsMatch(team, pick))
  );

  const championshipRound = normalized.find(
    (round) => round.round === "Championship"
  );
  const championTeam = championshipRound?.teams?.[0]?.trim() ?? "";

  if (championTeam) {
    return teamsMatch(championTeam, pick);
  }

  return appearsInResults;
}

export async function GET() {
  const [playersRes, bracketsRes, resultsRes] = await Promise.all([
    supabaseAdmin
      .from("players")
      .select(
        `
        id,
        name,
        avatar_url,
        status
      `
      )
      .order("name", { ascending: true }),

    supabaseAdmin
      .from("brackets")
      .select(
        `
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
      `
      )
      .order("created_at", { ascending: true }),

    supabaseAdmin
      .from("tournament_results")
      .select("id, label, readable_results, updated_at")
      .eq("id", "current")
      .maybeSingle(),
  ]);

  if (playersRes.error) {
    return NextResponse.json(
      { error: playersRes.error.message },
      { status: 500 }
    );
  }

  if (bracketsRes.error) {
    return NextResponse.json(
      { error: bracketsRes.error.message },
      { status: 500 }
    );
  }

  if (resultsRes.error) {
    return NextResponse.json(
      { error: resultsRes.error.message },
      { status: 500 }
    );
  }

  const officialResults = normalizeReadablePicks(
    Array.isArray(resultsRes.data?.readable_results)
      ? resultsRes.data.readable_results
      : []
  );

  const playersWithBrackets = (playersRes.data ?? []).map((player) => {
    const playerBrackets = (bracketsRes.data ?? [])
      .filter((bracket) => bracket.player_id === player.id)
      .map((bracket) => {
        const readablePicks = normalizeReadablePicks(
          Array.isArray(bracket.readable_picks) ? bracket.readable_picks : []
        );

        const computedScore = getBracketScore(readablePicks, officialResults);
        const championAlive = getChampionAliveFromResults(
          bracket.champion_pick,
          officialResults
        );

        return {
          id: bracket.id,
          label:
            bracket.label ||
            bracket.bracket_name ||
            `${player.name} Bracket`,
          image: bracket.image_url || bracket.bracket_url || undefined,
          paid: !!bracket.paid,
          submitted: !!bracket.submitted,
          locked: !!bracket.locked,
          score: computedScore,
          championAlive,
          championPick: bracket.champion_pick ?? undefined,
          busted: !championAlive,
          readablePicks,
        };
      });

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
    officialResults,
    updatedAt: new Date().toISOString(),
  });
}