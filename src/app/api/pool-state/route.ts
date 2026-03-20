import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBracketScore } from "@/lib/scoreBracket";
import {
  normalizeReadablePicks,
  ROUND_ORDER,
  ROUND_SIZES,
  type PickRound,
} from "@/lib/bracketRounds";
import { FIRST_ROUND_MATCHUPS } from "@/lib/bracket-data";
import { teamsMatch } from "@/lib/normalizeTeamName";

type EspnTeam = {
  displayName?: string;
  abbreviation?: string;
  shortDisplayName?: string;
};

type EspnCompetitor = {
  homeAway?: "home" | "away";
  winner?: boolean;
  score?: string;
  team?: EspnTeam;
};

type EspnCompetition = {
  competitors?: EspnCompetitor[];
  status?: {
    type?: {
      name?: string;
      state?: string;
      description?: string;
      shortDetail?: string;
      completed?: boolean;
    };
  };
};

type EspnEvent = {
  id?: string;
  date?: string;
  name?: string;
  shortName?: string;
  competitions?: EspnCompetition[];
  status?: {
    type?: {
      name?: string;
      state?: string;
      description?: string;
      shortDetail?: string;
      completed?: boolean;
    };
  };
};

type EspnScoreboardResponse = {
  events?: EspnEvent[];
};

type NormalizedFinalGame = {
  id: string;
  completed: boolean;
  awayTeam: string;
  homeTeam: string;
  winner: string | null;
  loser: string | null;
  awayScore: number | null;
  homeScore: number | null;
};

function yyyymmdd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function buildDateRange() {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  start.setDate(start.getDate() - 30);
  end.setDate(end.getDate() + 7);

  return `${yyyymmdd(start)}-${yyyymmdd(end)}`;
}

function cleanTeamName(value?: string) {
  return (value ?? "").trim();
}

function canonicalTeamName(competitor?: EspnCompetitor) {
  return (
    cleanTeamName(competitor?.team?.displayName) ||
    cleanTeamName(competitor?.team?.shortDisplayName) ||
    cleanTeamName(competitor?.team?.abbreviation) ||
    ""
  );
}

function normalizeEspnEvent(event: EspnEvent): NormalizedFinalGame | null {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];

  const away = competitors.find((team) => team.homeAway === "away");
  const home = competitors.find((team) => team.homeAway === "home");

  if (!away || !home || !event.id) {
    return null;
  }

  const status =
    competition?.status?.type ??
    event.status?.type ?? {
      completed: false,
    };

  const awayCanonical = canonicalTeamName(away);
  const homeCanonical = canonicalTeamName(home);

  const winner = away.winner
    ? awayCanonical
    : home.winner
      ? homeCanonical
      : null;

  const loser = away.winner
    ? homeCanonical
    : home.winner
      ? awayCanonical
      : null;

  return {
    id: event.id,
    completed: Boolean(status.completed),
    awayTeam: awayCanonical,
    homeTeam: homeCanonical,
    winner,
    loser,
    awayScore: away.score ? Number(away.score) : null,
    homeScore: home.score ? Number(home.score) : null,
  };
}

async function fetchCompletedGames(): Promise<NormalizedFinalGame[]> {
  const dates = buildDateRange();
  const url =
    `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard` +
    `?dates=${dates}&groups=50&limit=500`;

  const response = await fetch(url, {
    next: { revalidate: 60 },
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`ESPN request failed with status ${response.status}`);
  }

  const data = (await response.json()) as EspnScoreboardResponse;

  return (data.events ?? [])
    .map(normalizeEspnEvent)
    .filter((game): game is NormalizedFinalGame => Boolean(game && game.completed));
}

function findCompletedWinner(
  completedGames: NormalizedFinalGame[],
  expectedTeamA: string,
  expectedTeamB: string
): string {
  const matchedGame = completedGames.find((game) => {
    const gameHasBothTeams =
      (teamsMatch(game.awayTeam, expectedTeamA) &&
        teamsMatch(game.homeTeam, expectedTeamB)) ||
      (teamsMatch(game.awayTeam, expectedTeamB) &&
        teamsMatch(game.homeTeam, expectedTeamA));

    return gameHasBothTeams && Boolean(game.winner);
  });

  if (!matchedGame?.winner) {
    return "";
  }

  if (teamsMatch(matchedGame.winner, expectedTeamA)) {
    return expectedTeamA;
  }

  if (teamsMatch(matchedGame.winner, expectedTeamB)) {
    return expectedTeamB;
  }

  return "";
}

function buildAutomaticResults(completedGames: NormalizedFinalGame[]): PickRound[] {
  const resultsByRound: Record<string, string[]> = Object.fromEntries(
    ROUND_ORDER.map((round) => [round, Array.from({ length: ROUND_SIZES[round] }, () => "")])
  );

  const round64Winners = FIRST_ROUND_MATCHUPS.map((matchup) => {
    const teamA = matchup.teams[0]?.name ?? "";
    const teamB = matchup.teams[1]?.name ?? "";
    return findCompletedWinner(completedGames, teamA, teamB);
  });

  resultsByRound["Round of 64"] = round64Winners;

  for (let roundIndex = 1; roundIndex < ROUND_ORDER.length; roundIndex++) {
    const roundName = ROUND_ORDER[roundIndex];
    const previousRoundName = ROUND_ORDER[roundIndex - 1];
    const previousWinners = resultsByRound[previousRoundName] ?? [];
    const slotCount = ROUND_SIZES[roundName];

    resultsByRound[roundName] = Array.from({ length: slotCount }, (_, gameIndex) => {
      const feederA = previousWinners[gameIndex * 2] ?? "";
      const feederB = previousWinners[gameIndex * 2 + 1] ?? "";

      if (!feederA || !feederB) {
        return "";
      }

      return findCompletedWinner(completedGames, feederA, feederB);
    });
  }

  return normalizeReadablePicks(
    ROUND_ORDER.map((round) => ({
      round,
      teams: resultsByRound[round] ?? [],
    }))
  );
}

export async function GET() {
  try {
    const [playersRes, bracketsRes, completedGames] = await Promise.all([
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
      fetchCompletedGames(),
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

    const automaticResults = buildAutomaticResults(completedGames);

    const playersWithBrackets = (playersRes.data ?? []).map((player) => {
      const playerBrackets = (bracketsRes.data ?? [])
        .filter((bracket) => bracket.player_id === player.id)
        .map((bracket) => {
          const readablePicks = normalizeReadablePicks(
            Array.isArray(bracket.readable_picks) ? bracket.readable_picks : []
          );

          const computedScore = getBracketScore(readablePicks, automaticResults);

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
            championAlive: bracket.champion_alive ?? true,
            championPick: bracket.champion_pick ?? undefined,
            busted: !!bracket.busted,
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
      currentResults: automaticResults,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build pool state.",
      },
      { status: 500 }
    );
  }
}