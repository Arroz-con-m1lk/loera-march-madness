export type PickRound = {
  round: string;
  teams: string[];
};

export const ROUND_ORDER = [
  "Round of 64",
  "Round of 32",
  "Sweet 16",
  "Elite 8",
  "Final 4",
  "Championship",
] as const;

export type RoundName = (typeof ROUND_ORDER)[number];

export const ROUND_SIZES: Record<RoundName, number> = {
  "Round of 64": 32,
  "Round of 32": 16,
  "Sweet 16": 8,
  "Elite 8": 4,
  "Final 4": 2,
  Championship: 1,
};

export function createEmptyRounds(): PickRound[] {
  return ROUND_ORDER.map((round) => ({
    round,
    teams: Array.from({ length: ROUND_SIZES[round] }, () => ""),
  }));
}

export function normalizeReadablePicks(value?: PickRound[] | null): PickRound[] {
  const defaults = createEmptyRounds();

  if (!Array.isArray(value) || value.length === 0) {
    return defaults;
  }

  const byRound = new Map<string, string[]>();

  for (const entry of value) {
    if (!entry || typeof entry.round !== "string") continue;

    const safeTeams = Array.isArray(entry.teams)
      ? entry.teams.map((team) => (typeof team === "string" ? team.trim() : ""))
      : [];

    byRound.set(entry.round, safeTeams);
  }

  return defaults.map((defaultRound) => {
    const existingTeams = byRound.get(defaultRound.round) ?? [];
    const sizedTeams = [...existingTeams];

    while (sizedTeams.length < ROUND_SIZES[defaultRound.round as RoundName]) {
      sizedTeams.push("");
    }

    return {
      round: defaultRound.round,
      teams: sizedTeams.slice(0, ROUND_SIZES[defaultRound.round as RoundName]),
    };
  });
}

export function updateRoundTeam(
  rounds: PickRound[],
  roundName: string,
  index: number,
  value: string
): PickRound[] {
  return normalizeReadablePicks(rounds).map((round) => {
    if (round.round !== roundName) return round;

    const nextTeams = [...round.teams];
    nextTeams[index] = value;

    return {
      ...round,
      teams: nextTeams,
    };
  });
}

export function getChampionPickFromRounds(rounds: PickRound[]): string {
  const normalized = normalizeReadablePicks(rounds);
  const championship = normalized.find((round) => round.round === "Championship");
  return championship?.teams?.[0]?.trim() || "";
}

export function getTotalEnteredTeams(rounds: PickRound[]): number {
  return normalizeReadablePicks(rounds).reduce((sum, round) => {
    return sum + round.teams.filter((team) => team.trim().length > 0).length;
  }, 0);
}