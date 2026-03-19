import {
  PickRound,
  ROUND_ORDER,
  ROUND_SIZES,
  createEmptyRounds,
  normalizeReadablePicks,
} from "./bracketRounds";

export type BracketRoundTemplate = {
  round: (typeof ROUND_ORDER)[number];
  slots: number;
};

export type BracketGame = {
  id: string;
  round: (typeof ROUND_ORDER)[number];
  slot: number;
  teamA?: string;
  teamB?: string;
  winner?: string;
};

export const BRACKET_TEMPLATE: BracketRoundTemplate[] = ROUND_ORDER.map(
  (round) => ({
    round,
    slots: ROUND_SIZES[round],
  })
);

export function getRoundSlotCount(round: string): number {
  return ROUND_SIZES[round as keyof typeof ROUND_SIZES] ?? 0;
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

export function readablePicksToRoundMap(rounds: PickRound[]): Record<string, string[]> {
  const normalized = normalizeReadablePicks(rounds);

  return Object.fromEntries(
    normalized.map((round) => [round.round, round.teams])
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
  patch: Partial<Record<(typeof ROUND_ORDER)[number], string[]>>
): PickRound[] {
  const normalized = normalizeReadablePicks(current);

  return normalized.map((round) => ({
    round: round.round,
    teams: patch[round.round] ?? round.teams,
  }));
}