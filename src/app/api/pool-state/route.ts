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
import { normalizeTeamName, teamsMatch } from "@/lib/normalizeTeamName";

type NcaaTeamNames = {
  full?: string;
  short?: string;
  seo?: string;
  char6?: string;
};

type NcaaSide = {
  winner?: boolean;
  score?: string | number;
  seed?: string | number;
  names?: NcaaTeamNames;
};

type NcaaGameNode = {
  id?: string;
  gameID?: string;
  contestName?: string;
  startTimeEpoch?: number;
  gameState?: string;
  finalMessage?: string;
  currentPeriod?: string | number;
  away?: NcaaSide;
  home?: NcaaSide;
};

type NcaaScoreboardEntry = {
  game?: NcaaGameNode;
} & NcaaGameNode;

type NcaaScoreboardResponse = {
  games?: NcaaScoreboardEntry[];
};

type NormalizedCompletedGame = {
  id: string;
  awayTeam: string;
  homeTeam: string;
  winner: string | null;
  loser: string | null;
  awayScore: number | null;
  homeScore: number | null;
};

function yyyymmddParts(date: Date) {
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return { y, m, d };
}

function toNcaaDatePath(date: Date) {
  const { y, m, d } = yyyymmddParts(date);
  return `${y}/${m}/${d}`;
}

function buildDatesToFetch() {
  const now = new Date();
  const dates: Date[] = [];

  for (let offset = 21; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    dates.push(date);
  }

  return dates;
}

function firstNonEmpty(...values: Array<string | undefined>) {
  for (const value of values) {
    const cleaned = (value ?? "").trim();
    if (cleaned) return cleaned;
  }
  return "";
}

function canonicalNcaaTeamName(side?: NcaaSide) {
  return firstNonEmpty(
    side?.names?.full,
    side?.names?.short,
    side?.names?.seo,
    side?.names?.char6
  );
}

function parseScore(value?: string | number) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isCompletedGame(node: NcaaGameNode) {
  const gameState = String(node.gameState ?? "").toLowerCase();
  const finalMessage = String(node.finalMessage ?? "").toLowerCase();

  return (
    gameState.includes("final") ||
    finalMessage.includes("final") ||
    Boolean(node.away?.winner) ||
    Boolean(node.home?.winner)
  );
}

function normalizeNcaaEntry(
  entry: NcaaScoreboardEntry
): NormalizedCompletedGame | null {
  const node = entry.game ?? entry;
  const awayTeam = canonicalNcaaTeamName(node.away);
  const homeTeam = canonicalNcaaTeamName(node.home);

  if (!awayTeam || !homeTeam || !isCompletedGame(node)) {
    return null;
  }

  const awayWon = Boolean(node.away?.winner);
  const homeWon = Boolean(node.home?.winner);

  let winner: string | null = null;
  let loser: string | null = null;

  if (awayWon && !homeWon) {
    winner = awayTeam;
    loser = homeTeam;
  } else if (homeWon && !awayWon) {
    winner = homeTeam;
    loser = awayTeam;
  } else {
    const awayScore = parseScore(node.away?.score);
    const homeScore = parseScore(node.home?.score);

    if (awayScore !== null && homeScore !== null) {
      if (awayScore > homeScore) {
        winner = awayTeam;
        loser = homeTeam;
      } else if (homeScore > awayScore) {
        winner = homeTeam;
        loser = awayTeam;
      }
    }
  }

  if (!winner || !loser) {
    return null;
  }

  return {
    id: String(node.id ?? node.gameID ?? `${awayTeam}-${homeTeam}`),
    awayTeam,
    homeTeam,
    winner,
    loser,
    awayScore: parseScore(node.away?.score),
    homeScore: parseScore(node.home?.score),
  };
}

async function fetchCompletedGamesForDate(
  date: Date
): Promise<NormalizedCompletedGame[]> {
  const datePath = toNcaaDatePath(date);
  const url = `https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/${datePath}/scoreboard.json`;

  const response = await fetch(url, {
    next: { revalidate: 60 },
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as NcaaScoreboardResponse;

  return (data.games ?? [])
    .map(normalizeNcaaEntry)
    .filter((game): game is NormalizedCompletedGame => Boolean(game));
}

async function fetchCompletedGames(): Promise<NormalizedCompletedGame[]> {
  const dates = buildDatesToFetch();
  const results = await Promise.all(dates.map(fetchCompletedGamesForDate));
  const deduped = new Map<string, NormalizedCompletedGame>();

  for (const games of results) {
    for (const game of games) {
      deduped.set(game.id, game);
    }
  }

  return Array.from(deduped.values());
}

function teamsSoftMatch(a: string, b: string) {
  if (teamsMatch(a, b)) return true;

  const aNorm = normalizeTeamName(a);
  const bNorm = normalizeTeamName(b);

  if (!aNorm || !bNorm) return false;
  if (aNorm === bNorm) return true;

  const shorter = aNorm.length <= bNorm.length ? aNorm : bNorm;
  const longer = aNorm.length > bNorm.length ? aNorm : bNorm;

  return shorter.length >= 4 && longer.includes(shorter);
}

function findCompletedWinner(
  completedGames: NormalizedCompletedGame[],
  expectedTeamA: string,
  expectedTeamB: string
): string {
  const matchedGame = completedGames.find((game) => {
    const directMatch =
      (teamsSoftMatch(game.awayTeam, expectedTeamA) &&
        teamsSoftMatch(game.homeTeam, expectedTeamB)) ||
      (teamsSoftMatch(game.awayTeam, expectedTeamB) &&
        teamsSoftMatch(game.homeTeam, expectedTeamA));

    return directMatch && Boolean(game.winner);
  });

  if (!matchedGame?.winner) {
    return "";
  }

  if (teamsSoftMatch(matchedGame.winner, expectedTeamA)) {
    return expectedTeamA;
  }

  if (teamsSoftMatch(matchedGame.winner, expectedTeamB)) {
    return expectedTeamB;
  }

  return "";
}

function getPreviousRoundFeeders(
  previousRoundTeams: string[],
  roundName: string,
  gameIndex: number
): [string, string] {
  if (roundName === "Final 4") {
    if (gameIndex === 0) {
      return [previousRoundTeams[0] ?? "", previousRoundTeams[2] ?? ""];
    }

    if (gameIndex === 1) {
      return [previousRoundTeams[1] ?? "", previousRoundTeams[3] ?? ""];
    }
  }

  return [
    previousRoundTeams[gameIndex * 2] ?? "",
    previousRoundTeams[gameIndex * 2 + 1] ?? "",
  ];
}

function buildAutomaticResults(
  completedGames: NormalizedCompletedGame[]
): PickRound[] {
  const resultsByRound: Record<string, string[]> = Object.fromEntries(
    ROUND_ORDER.map((round) => [
      round,
      Array.from({ length: ROUND_SIZES[round] }, () => ""),
    ])
  );

  resultsByRound["Round of 64"] = FIRST_ROUND_MATCHUPS.map((matchup) => {
    const teamA = matchup.teams[0]?.name ?? "";
    const teamB = matchup.teams[1]?.name ?? "";
    return findCompletedWinner(completedGames, teamA, teamB);
  });

  for (let roundIndex = 1; roundIndex < ROUND_ORDER.length; roundIndex += 1) {
    const roundName = ROUND_ORDER[roundIndex];
    const previousRoundName = ROUND_ORDER[roundIndex - 1];
    const previousWinners = resultsByRound[previousRoundName] ?? [];
    const slotCount = ROUND_SIZES[roundName];

    resultsByRound[roundName] = Array.from(
      { length: slotCount },
      (_, gameIndex) => {
        const [feederA, feederB] = getPreviousRoundFeeders(
          previousWinners,
          roundName,
          gameIndex
        );

        if (!feederA || !feederB) {
          return "";
        }

        return findCompletedWinner(completedGames, feederA, feederB);
      }
    );
  }

  return normalizeReadablePicks(
    ROUND_ORDER.map((round) => ({
      round,
      teams: resultsByRound[round] ?? [],
    }))
  );
}

function computeChampionAlive(
  championPick: string | null | undefined,
  completedGames: NormalizedCompletedGame[]
) {
  const trimmed = (championPick ?? "").trim();
  if (!trimmed) return true;

  const eliminated = completedGames.some(
    (game) => game.loser && teamsSoftMatch(game.loser, trimmed)
  );

  return !eliminated;
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

    console.log("COMPLETED GAMES COUNT:", completedGames.length);
    console.log(
      "COMPLETED GAMES SAMPLE:",
      completedGames.slice(0, 10).map((game) => ({
        awayTeam: game.awayTeam,
        homeTeam: game.homeTeam,
        winner: game.winner,
        loser: game.loser,
      }))
    );
    console.log(
      "FIRST MATCHUP SAMPLE:",
      FIRST_ROUND_MATCHUPS.slice(0, 5).map((matchup) => ({
        teamA: matchup.teams[0]?.name,
        teamB: matchup.teams[1]?.name,
      }))
    );
    console.log(
      "ROUND OF 64 AUTO RESULTS:",
      automaticResults.find((round) => round.round === "Round of 64")
    );

    const playersWithBrackets = (playersRes.data ?? []).map((player) => {
      const playerBrackets = (bracketsRes.data ?? [])
        .filter((bracket) => bracket.player_id === player.id)
        .map((bracket) => {
          const readablePicks = normalizeReadablePicks(
            Array.isArray(bracket.readable_picks) ? bracket.readable_picks : []
          );

          const computedScore = getBracketScore(readablePicks, automaticResults);
          const championAlive = computeChampionAlive(
            bracket.champion_pick,
            completedGames
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
      currentResults: automaticResults,
      completedGames,
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