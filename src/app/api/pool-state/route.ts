import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBracketScore, isTeamStillAlive } from "@/lib/scoreBracket";
import {
  getChampionPickFromRounds,
  normalizeReadablePicks,
  type PickRound,
} from "@/lib/bracketRounds";

function getEffectiveChampionPick(
  readablePicks: PickRound[],
  storedChampionPick: string | null | undefined
) {
  const fromReadable = getChampionPickFromRounds(readablePicks).trim();
  if (fromReadable) return fromReadable;

  return (storedChampionPick ?? "").trim();
}

function getChampionAliveFromResults(
  championPick: string,
  results: PickRound[]
) {
  if (!championPick) return true;
  return isTeamStillAlive(championPick, results);
}

function hasAnyFilledPicks(readablePicks: PickRound[]) {
  return readablePicks.some((round) =>
    round.teams.some((team) => team.trim().length > 0)
  );
}

function hasAnyFutureScoringPath(
  readablePicks: PickRound[],
  officialResults: PickRound[]
) {
  const normalizedPicks = normalizeReadablePicks(readablePicks);
  const normalizedResults = normalizeReadablePicks(officialResults);

  for (const pickRound of normalizedPicks) {
    const resultRound = normalizedResults.find(
      (round) => round.round === pickRound.round
    );

    const picks = pickRound.teams ?? [];
    const winners = resultRound?.teams ?? [];

    for (let slotIndex = 0; slotIndex < picks.length; slotIndex += 1) {
      const pickedTeam = picks[slotIndex]?.trim() ?? "";
      if (!pickedTeam) continue;

      const officialWinner = winners[slotIndex]?.trim() ?? "";

      // If that game is already decided, this slot cannot add future points.
      if (officialWinner) {
        continue;
      }

      // Unresolved slot + team still alive = future path still exists.
      if (isTeamStillAlive(pickedTeam, normalizedResults)) {
        return true;
      }
    }
  }

  return false;
}

function getBracketBusted(
  readablePicks: PickRound[],
  officialResults: PickRound[],
  options?: {
    championPick?: string | null;
    paid?: boolean;
    submitted?: boolean;
    locked?: boolean;
  }
) {
  const normalizedPicks = normalizeReadablePicks(readablePicks);
  const normalizedResults = normalizeReadablePicks(officialResults);

  const effectiveChampionPick = getEffectiveChampionPick(
    normalizedPicks,
    options?.championPick
  );

  const hasReadable = hasAnyFilledPicks(normalizedPicks);

  // Entered bracket with no readable picks and no champion path is dead.
  if (!hasReadable) {
    if ((options?.paid || options?.submitted || options?.locked) && !effectiveChampionPick) {
      return true;
    }

    if (effectiveChampionPick) {
      return !isTeamStillAlive(effectiveChampionPick, normalizedResults);
    }

    return false;
  }

  return !hasAnyFutureScoringPath(normalizedPicks, normalizedResults);
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

        const effectiveChampionPick = getEffectiveChampionPick(
          readablePicks,
          bracket.champion_pick
        );

        const computedScore = getBracketScore(readablePicks, officialResults);
        const championAlive = getChampionAliveFromResults(
          effectiveChampionPick,
          officialResults
        );
        const busted = getBracketBusted(readablePicks, officialResults, {
          championPick: effectiveChampionPick,
          paid: !!bracket.paid,
          submitted: !!bracket.submitted,
          locked: !!bracket.locked,
        });

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
          championPick: effectiveChampionPick || undefined,
          busted,
          readablePicks,
        };
      });

    const totalScore = playerBrackets.reduce(
      (sum, bracket) => sum + (bracket.score ?? 0),
      0
    );

    const allBusted =
      playerBrackets.length > 0 &&
      playerBrackets.every((bracket) => bracket.busted === true);

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
      championAlive: !allBusted,
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