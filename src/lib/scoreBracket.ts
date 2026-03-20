import {
  PickRound,
  ROUND_ORDER,
  ROUND_SIZES,
  createEmptyRounds,
  normalizeReadablePicks,
} from "./bracketRounds";

export type RoundKey = (typeof ROUND_ORDER)[number];

export type BracketRoundTemplate = {
  round: RoundKey;
  slots: number;
};

export type BracketGame = {
  id: string;
  round: RoundKey;
  slot: number;
  teamA?: string;
  teamB?: string;
  winner?: string;
};

export type ScoreBreakdownItem = {
  round: RoundKey;
  pointsPerPick: number;
  correctPicks: number;
  possiblePicks: number;
  points: number;
};

export type ScoreBracketResult = {
  totalScore: number;
  breakdown: ScoreBreakdownItem[];
};

export const BRACKET_TEMPLATE: BracketRoundTemplate[] = ROUND_ORDER.map(
  (round) => ({
    round,
    slots: ROUND_SIZES[round],
  })
);

export const ROUND_POINTS: Record<RoundKey, number> = {
  "Round of 64": 1,
  "Round of 32": 2,
  "Sweet 16": 4,
  "Elite 8": 8,
  "Final 4": 16,
  Championship: 32,
};

export function getRoundSlotCount(round: string): number {
  return ROUND_SIZES[round as keyof typeof ROUND_SIZES] ?? 0;
}

export function getRoundPoints(round: string): number {
  return ROUND_POINTS[round as RoundKey] ?? 0;
}

export function buildEmptyBracketGames(): BracketGame[] {
  return BRACKET_TEMPLATE.flatMap((roundTemplate) =>
    Array.from({ length: roundTemplate.slots }, (_, index) => ({
      id: `${roundTemplate.round}-${index + 1}`,
      round: roundTemplate.round,
      slot: index,
      teamA: "",
      teamB: "",
      winner: "",
    }))
  );
}

export function readablePicksToRoundMap(
  rounds: PickRound[]
): Record<string, string[]> {
  const normalized = normalizeReadablePicks(rounds);

  return Object.fromEntries(
    normalized.map((round) => [round.round, [...round.teams]])
  );
}

export function roundMapToReadablePicks(
  roundMap: Record<string, string[]>
): PickRound[] {
  return normalizeReadablePicks(
    createEmptyRounds().map((round) => ({
      round: round.round,
      teams: roundMap[round.round] ?? [],
    }))
  );
}

export function mergeReadablePicks(
  current: PickRound[],
  patch: Partial<Record<RoundKey, string[]>>
): PickRound[] {
  const normalized = normalizeReadablePicks(current);

  return normalized.map((round) => {
    const roundKey = round.round as RoundKey;

    return {
      round: round.round,
      teams: patch[roundKey] ?? round.teams,
    };
  });
}

function normalizeTeamName(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

export function countCorrectPicksForRound(
  picks: PickRound[],
  results: PickRound[],
  round: RoundKey
): number {
  const picksMap = readablePicksToRoundMap(picks);
  const resultsMap = readablePicksToRoundMap(results);

  const pickedTeams = picksMap[round] ?? [];
  const winningTeams = resultsMap[round] ?? [];
  const slotCount = ROUND_SIZES[round] ?? 0;

  let correct = 0;

  for (let index = 0; index < slotCount; index++) {
    const picked = normalizeTeamName(pickedTeams[index]);
    const winner = normalizeTeamName(winningTeams[index]);

    if (!picked || !winner) continue;
    if (picked === winner) correct += 1;
  }

  return correct;
}

export function scoreBracket(
  picks: PickRound[],
  results: PickRound[]
): ScoreBracketResult {
  const normalizedPicks = normalizeReadablePicks(picks);
  const normalizedResults = normalizeReadablePicks(results);

  const breakdown: ScoreBreakdownItem[] = ROUND_ORDER.map((round) => {
    const correctPicks = countCorrectPicksForRound(
      normalizedPicks,
      normalizedResults,
      round
    );
    const possiblePicks = ROUND_SIZES[round];
    const pointsPerPick = ROUND_POINTS[round];
    const points = correctPicks * pointsPerPick;

    return {
      round,
      pointsPerPick,
      correctPicks,
      possiblePicks,
      points,
    };
  });

  const totalScore = breakdown.reduce((sum, item) => sum + item.points, 0);

  return {
    totalScore,
    breakdown,
  };
}

export function getBracketScore(
  picks: PickRound[],
  results: PickRound[]
): number {
  return scoreBracket(picks, results).totalScore;
}