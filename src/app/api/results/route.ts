import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeReadablePicks, type PickRound } from "@/lib/bracketRounds";
import { getBracketScore } from "@/lib/scoreBracket";
import { teamsMatch } from "@/lib/normalizeTeamName";

type ResultsRow = {
  id: string;
  label: string;
  readable_results: PickRound[] | null;
  updated_at?: string | null;
};

type PlayerRow = {
  id: string;
  name: string;
  status?: string | null;
};

type BracketRow = {
  id: string;
  player_id: string;
  label?: string | null;
  bracket_name?: string | null;
  paid?: boolean | null;
  locked?: boolean | null;
  submitted?: boolean | null;
  readable_picks?: PickRound[] | null;
};

type BracketSnapshot = {
  id: string;
  playerId: string;
  playerName: string;
  label: string;
  paid: boolean;
  locked: boolean;
  submitted: boolean;
  score: number;
  busted: boolean;
  livePickCount: number;
};

type PlayerLeaderboardRow = {
  playerId: string;
  playerName: string;
  bestLockedScore: number;
  lockedCount: number;
};

type AlertInsert = {
  message: string;
  type: string;
  entity_key: string;
  expires_at: string;
  player_name?: string | null;
  bracket_label?: string | null;
  score?: number | null;
};

function normalizeName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getBracketLabel(bracket: BracketRow, playerName: string) {
  return bracket.label || bracket.bracket_name || `${playerName} Bracket`;
}

function didTeamLoseBeforeRound(
  team: string,
  roundIndex: number,
  officialResults: PickRound[]
) {
  const normalizedTeam = normalizeName(team);

  for (let i = 0; i < roundIndex; i += 1) {
    const priorRound = officialResults[i];
    const winners = priorRound?.teams ?? [];
    const anyPriorResultsEntered = winners.some(
      (winner) => winner.trim().length > 0
    );

    if (!anyPriorResultsEntered) {
      continue;
    }

    const stillAliveInPriorRound = winners.some((winner) =>
      teamsMatch(winner, normalizedTeam)
    );

    if (!stillAliveInPriorRound) {
      return true;
    }
  }

  return false;
}

function getBracketBusted(
  readablePicks: PickRound[],
  officialResults: PickRound[]
) {
  const normalizedPicks = normalizeReadablePicks(readablePicks);
  const normalizedResults = normalizeReadablePicks(officialResults);

  for (let roundIndex = 0; roundIndex < normalizedPicks.length; roundIndex += 1) {
    const pickRound = normalizedPicks[roundIndex];
    const resultRound = normalizedResults[roundIndex];
    const picks = pickRound?.teams ?? [];
    const winners = resultRound?.teams ?? [];

    for (let i = 0; i < picks.length; i += 1) {
      const pickedTeam = picks[i]?.trim();
      if (!pickedTeam) continue;

      const officialWinner = winners[i]?.trim();

      if (officialWinner) {
        if (teamsMatch(officialWinner, pickedTeam)) {
          continue;
        }

        continue;
      }

      const deadEarlier = didTeamLoseBeforeRound(
        pickedTeam,
        roundIndex,
        normalizedResults
      );

      if (!deadEarlier) {
        return false;
      }
    }
  }

  return true;
}

function getLivePickCount(
  readablePicks: PickRound[],
  officialResults: PickRound[]
) {
  const normalizedPicks = normalizeReadablePicks(readablePicks);
  const normalizedResults = normalizeReadablePicks(officialResults);

  let count = 0;

  for (let roundIndex = 0; roundIndex < normalizedPicks.length; roundIndex += 1) {
    const pickRound = normalizedPicks[roundIndex];
    const resultRound = normalizedResults[roundIndex];
    const picks = pickRound?.teams ?? [];
    const winners = resultRound?.teams ?? [];

    for (let i = 0; i < picks.length; i += 1) {
      const pickedTeam = picks[i]?.trim();
      if (!pickedTeam) continue;

      const officialWinner = winners[i]?.trim();

      if (officialWinner) {
        continue;
      }

      const deadEarlier = didTeamLoseBeforeRound(
        pickedTeam,
        roundIndex,
        normalizedResults
      );

      if (!deadEarlier) {
        count += 1;
      }
    }
  }

  return count;
}

function buildBracketSnapshots(
  players: PlayerRow[],
  brackets: BracketRow[],
  officialResults: PickRound[]
) {
  const playerNameById = new Map(players.map((player) => [player.id, player.name]));

  return brackets.map((bracket) => {
    const playerName = playerNameById.get(bracket.player_id) ?? "Unknown";
    const readablePicks = normalizeReadablePicks(
      Array.isArray(bracket.readable_picks) ? bracket.readable_picks : []
    );

    return {
      id: bracket.id,
      playerId: bracket.player_id,
      playerName,
      label: getBracketLabel(bracket, playerName),
      paid: !!bracket.paid,
      locked: !!bracket.locked,
      submitted: !!bracket.submitted,
      score: getBracketScore(readablePicks, officialResults),
      busted: getBracketBusted(readablePicks, officialResults),
      livePickCount: getLivePickCount(readablePicks, officialResults),
    } satisfies BracketSnapshot;
  });
}

function buildLeaderboard(
  players: PlayerRow[],
  bracketSnapshots: BracketSnapshot[]
): PlayerLeaderboardRow[] {
  return players
    .filter((player) => player.status === "confirmed")
    .map((player) => {
      const lockedPaid = bracketSnapshots.filter(
        (bracket) =>
          bracket.playerId === player.id && bracket.paid && bracket.locked
      );

      return {
        playerId: player.id,
        playerName: player.name,
        bestLockedScore:
          lockedPaid.length > 0
            ? Math.max(...lockedPaid.map((bracket) => bracket.score))
            : 0,
        lockedCount: lockedPaid.length,
      };
    })
    .sort((a, b) => {
      const scoreDiff = b.bestLockedScore - a.bestLockedScore;
      if (scoreDiff !== 0) return scoreDiff;

      const lockedDiff = b.lockedCount - a.lockedCount;
      if (lockedDiff !== 0) return lockedDiff;

      return a.playerName.localeCompare(b.playerName);
    });
}

function make24HourExpiryIso() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

function buildAlerts(
  oldLeaderboard: PlayerLeaderboardRow[],
  newLeaderboard: PlayerLeaderboardRow[],
  oldBrackets: BracketSnapshot[],
  newBrackets: BracketSnapshot[]
) {
  const alerts: AlertInsert[] = [];
  const expiresAt = make24HourExpiryIso();

  const oldLeader = oldLeaderboard[0];
  const newLeader = newLeaderboard[0];

  if (
    newLeader &&
    (!oldLeader || newLeader.playerName !== oldLeader.playerName)
  ) {
    alerts.push({
      message: `👑 ${newLeader.playerName} took the #1 spot`,
      type: "leader_change",
      entity_key: `leader:${newLeader.playerId}:${newLeader.bestLockedScore}`,
      expires_at: expiresAt,
      player_name: newLeader.playerName,
      score: newLeader.bestLockedScore,
    });
  }

  const oldTop3 = new Set(oldLeaderboard.slice(0, 3).map((row) => row.playerId));
  const newTop3 = newLeaderboard.slice(0, 3);

  for (const row of newTop3) {
    if (!oldTop3.has(row.playerId)) {
      alerts.push({
        message: `🔥 ${row.playerName} moved into the Top 3`,
        type: "top3_entry",
        entity_key: `top3:${row.playerId}:${row.bestLockedScore}`,
        expires_at: expiresAt,
        player_name: row.playerName,
        score: row.bestLockedScore,
      });
    }
  }

  const oldBracketMap = new Map(oldBrackets.map((bracket) => [bracket.id, bracket]));
  const newBracketMap = new Map(newBrackets.map((bracket) => [bracket.id, bracket]));

  for (const [bracketId, nextBracket] of newBracketMap) {
    if (!nextBracket.paid || !nextBracket.locked) continue;

    const prevBracket = oldBracketMap.get(bracketId);
    const oldLivePickCount = prevBracket?.livePickCount ?? Number.MAX_SAFE_INTEGER;
    const newLivePickCount = nextBracket.livePickCount;
    const oldBusted = prevBracket?.busted ?? false;
    const newBusted = nextBracket.busted;

    if (oldLivePickCount > 1 && newLivePickCount === 1 && !newBusted) {
      alerts.push({
        message: `⚠️ ${nextBracket.playerName}'s ${nextBracket.label} is down to 1 live team`,
        type: "one_left",
        entity_key: `one-left:${bracketId}:1`,
        expires_at: expiresAt,
        player_name: nextBracket.playerName,
        bracket_label: nextBracket.label,
        score: nextBracket.score,
      });
    }

    if (!oldBusted && newBusted) {
      alerts.push({
        message: `💀 ${nextBracket.playerName}'s ${nextBracket.label} is busted`,
        type: "busted",
        entity_key: `busted:${bracketId}`,
        expires_at: expiresAt,
        player_name: nextBracket.playerName,
        bracket_label: nextBracket.label,
        score: nextBracket.score,
      });
    }
  }

  return alerts;
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("tournament_results")
    .select("id, label, readable_results, updated_at")
    .eq("id", "current")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const readableResults = normalizeReadablePicks(
    Array.isArray(data?.readable_results) ? data.readable_results : []
  );

  return NextResponse.json({
    id: data?.id ?? "current",
    label: data?.label ?? "Official Results",
    readableResults,
    updatedAt: data?.updated_at ?? null,
  });
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      readableResults?: PickRound[];
      label?: string;
    };

    const nextReadableResults = normalizeReadablePicks(body.readableResults ?? []);
    const label =
      typeof body.label === "string" && body.label.trim()
        ? body.label.trim()
        : "Official Results";

    const [currentResultsRes, playersRes, bracketsRes] = await Promise.all([
      supabaseAdmin
        .from("tournament_results")
        .select("id, label, readable_results, updated_at")
        .eq("id", "current")
        .maybeSingle<ResultsRow>(),
      supabaseAdmin
        .from("players")
        .select("id, name, status")
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("brackets")
        .select(
          "id, player_id, label, bracket_name, paid, locked, submitted, readable_picks"
        )
        .order("created_at", { ascending: true }),
    ]);

    if (currentResultsRes.error) {
      return NextResponse.json(
        { error: currentResultsRes.error.message },
        { status: 500 }
      );
    }

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

    const previousReadableResults = normalizeReadablePicks(
      Array.isArray(currentResultsRes.data?.readable_results)
        ? currentResultsRes.data.readable_results
        : []
    );

    const players = (playersRes.data ?? []) as PlayerRow[];
    const brackets = (bracketsRes.data ?? []) as BracketRow[];

    const oldBracketSnapshots = buildBracketSnapshots(
      players,
      brackets,
      previousReadableResults
    );
    const newBracketSnapshots = buildBracketSnapshots(
      players,
      brackets,
      nextReadableResults
    );

    const oldLeaderboard = buildLeaderboard(players, oldBracketSnapshots);
    const newLeaderboard = buildLeaderboard(players, newBracketSnapshots);

    const alerts = buildAlerts(
      oldLeaderboard,
      newLeaderboard,
      oldBracketSnapshots,
      newBracketSnapshots
    );

    const { data, error } = await supabaseAdmin
      .from("tournament_results")
      .upsert(
        {
          id: "current",
          label,
          readable_results: nextReadableResults,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select("id, label, readable_results, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (alerts.length > 0) {
      const { error: alertsError } = await supabaseAdmin
        .from("live_alerts")
        .insert(alerts);

      if (alertsError) {
        console.error("Failed to insert live alerts:", alertsError.message);
      }
    }

    return NextResponse.json({
      id: data.id,
      label: data.label,
      readableResults: normalizeReadablePicks(
        Array.isArray(data.readable_results) ? data.readable_results : []
      ),
      updatedAt: data.updated_at ?? null,
      alertsCreated: alerts.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}