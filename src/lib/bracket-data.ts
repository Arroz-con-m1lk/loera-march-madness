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

export type TeamOption = {
  id: string;
  name: string;
  seed?: string;
};

export type BracketGame = {
  id: string;
  round: RoundKey;
  slot: number;
  teamA?: string;
  teamB?: string;
  winner?: string;
};

export type CascadeGame = {
  id: string;
  round: RoundKey;
  slot: number;
  teams: TeamOption[];
  winner: string | null;
};

export type CascadeRound = {
  round: RoundKey;
  games: CascadeGame[];
};

export const BRACKET_TEMPLATE: BracketRoundTemplate[] = ROUND_ORDER.map(
  (round) => ({
    round,
    slots: ROUND_SIZES[round],
  })
);

export const FIRST_ROUND_MATCHUPS: Array<{
  gameId: string;
  teams: TeamOption[];
}> = [
  {
    gameId: "round-of-64-1",
    teams: [
      { id: "duke", name: "Duke", seed: "1" },
      { id: "siena", name: "Siena", seed: "16" },
    ],
  },
  {
    gameId: "round-of-64-2",
    teams: [
      { id: "ohio-state", name: "Ohio State", seed: "8" },
      { id: "tcu", name: "TCU", seed: "9" },
    ],
  },
  {
    gameId: "round-of-64-3",
    teams: [
      { id: "st-johns", name: "St. John's", seed: "5" },
      { id: "northern-iowa", name: "Northern Iowa", seed: "12" },
    ],
  },
  {
    gameId: "round-of-64-4",
    teams: [
      { id: "kansas", name: "Kansas", seed: "4" },
      { id: "cal-baptist", name: "Cal Baptist", seed: "13" },
    ],
  },
  {
    gameId: "round-of-64-5",
    teams: [
      { id: "louisville", name: "Louisville", seed: "6" },
      { id: "south-florida", name: "South Florida", seed: "11" },
    ],
  },
  {
    gameId: "round-of-64-6",
    teams: [
      { id: "michigan-state", name: "Michigan State", seed: "3" },
      { id: "north-dakota-state", name: "North Dakota State", seed: "14" },
    ],
  },
  {
    gameId: "round-of-64-7",
    teams: [
      { id: "ucla", name: "UCLA", seed: "7" },
      { id: "ucf", name: "UCF", seed: "10" },
    ],
  },
  {
    gameId: "round-of-64-8",
    teams: [
      { id: "uconn", name: "UConn", seed: "2" },
      { id: "furman", name: "Furman", seed: "15" },
    ],
  },
  {
    gameId: "round-of-64-9",
    teams: [
      { id: "arizona", name: "Arizona", seed: "1" },
      { id: "long-island", name: "Long Island", seed: "16" },
    ],
  },
  {
    gameId: "round-of-64-10",
    teams: [
      { id: "villanova", name: "Villanova", seed: "8" },
      { id: "utah-state", name: "Utah State", seed: "9" },
    ],
  },
  {
    gameId: "round-of-64-11",
    teams: [
      { id: "wisconsin", name: "Wisconsin", seed: "5" },
      { id: "high-point", name: "High Point", seed: "12" },
    ],
  },
  {
    gameId: "round-of-64-12",
    teams: [
      { id: "arkansas", name: "Arkansas", seed: "4" },
      { id: "hawaii", name: "Hawaii", seed: "13" },
    ],
  },
  {
    gameId: "round-of-64-13",
    teams: [
      { id: "byu", name: "BYU", seed: "6" },
      { id: "texas", name: "Texas", seed: "11" },
    ],
  },
  {
    gameId: "round-of-64-14",
    teams: [
      { id: "gonzaga", name: "Gonzaga", seed: "3" },
      { id: "kennesaw-state", name: "Kennesaw State", seed: "14" },
    ],
  },
  {
    gameId: "round-of-64-15",
    teams: [
      { id: "miami-fl", name: "Miami (FL)", seed: "7" },
      { id: "missouri", name: "Missouri", seed: "10" },
    ],
  },
  {
    gameId: "round-of-64-16",
    teams: [
      { id: "purdue", name: "Purdue", seed: "2" },
      { id: "queens-nc", name: "Queens (N.C.)", seed: "15" },
    ],
  },
  {
    gameId: "round-of-64-17",
    teams: [
      { id: "florida", name: "Florida", seed: "1" },
      { id: "prairie-view-am", name: "Prairie View A&M", seed: "16" },
    ],
  },
  {
    gameId: "round-of-64-18",
    teams: [
      { id: "clemson", name: "Clemson", seed: "8" },
      { id: "iowa", name: "Iowa", seed: "9" },
    ],
  },
  {
    gameId: "round-of-64-19",
    teams: [
      { id: "vanderbilt", name: "Vanderbilt", seed: "5" },
      { id: "mcneese", name: "McNeese", seed: "12" },
    ],
  },
  {
    gameId: "round-of-64-20",
    teams: [
      { id: "nebraska", name: "Nebraska", seed: "4" },
      { id: "troy", name: "Troy", seed: "13" },
    ],
  },
  {
    gameId: "round-of-64-21",
    teams: [
      { id: "north-carolina", name: "North Carolina", seed: "6" },
      { id: "vcu", name: "VCU", seed: "11" },
    ],
  },
  {
    gameId: "round-of-64-22",
    teams: [
      { id: "illinois", name: "Illinois", seed: "3" },
      { id: "penn", name: "Penn", seed: "14" },
    ],
  },
  {
    gameId: "round-of-64-23",
    teams: [
      { id: "saint-marys", name: "Saint Mary's", seed: "7" },
      { id: "texas-am", name: "Texas A&M", seed: "10" },
    ],
  },
  {
    gameId: "round-of-64-24",
    teams: [
      { id: "houston", name: "Houston", seed: "2" },
      { id: "idaho", name: "Idaho", seed: "15" },
    ],
  },
  {
    gameId: "round-of-64-25",
    teams: [
      { id: "michigan", name: "Michigan", seed: "1" },
      { id: "howard", name: "Howard", seed: "16" },
    ],
  },
  {
    gameId: "round-of-64-26",
    teams: [
      { id: "georgia", name: "Georgia", seed: "8" },
      { id: "saint-louis", name: "Saint Louis", seed: "9" },
    ],
  },
  {
    gameId: "round-of-64-27",
    teams: [
      { id: "texas-tech", name: "Texas Tech", seed: "5" },
      { id: "akron", name: "Akron", seed: "12" },
    ],
  },
  {
    gameId: "round-of-64-28",
    teams: [
      { id: "alabama", name: "Alabama", seed: "4" },
      { id: "hofstra", name: "Hofstra", seed: "13" },
    ],
  },
  {
    gameId: "round-of-64-29",
    teams: [
      { id: "tennessee", name: "Tennessee", seed: "6" },
      { id: "miami-oh", name: "Miami (Ohio)", seed: "11" },
      { id: "smu", name: "SMU", seed: "11" },
    ],
  },
  {
    gameId: "round-of-64-30",
    teams: [
      { id: "virginia", name: "Virginia", seed: "3" },
      { id: "wright-state", name: "Wright State", seed: "14" },
    ],
  },
  {
    gameId: "round-of-64-31",
    teams: [
      { id: "kentucky", name: "Kentucky", seed: "7" },
      { id: "santa-clara", name: "Santa Clara", seed: "10" },
    ],
  },
  {
    gameId: "round-of-64-32",
    teams: [
      { id: "iowa-state", name: "Iowa State", seed: "2" },
      { id: "tennessee-state", name: "Tennessee State", seed: "15" },
    ],
  },
];

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

export function createEmptyCascadeRounds(): CascadeRound[] {
  return ROUND_ORDER.map((round) => ({
    round,
    games: Array.from({ length: ROUND_SIZES[round] }, (_, index) => ({
      id: `${round}-${index + 1}`,
      round,
      slot: index,
      teams: [],
      winner: null,
    })),
  }));
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

export function readablePicksToCascadeRounds(
  rounds: PickRound[]
): CascadeRound[] {
  const normalized = normalizeReadablePicks(rounds);
  const empty = createEmptyCascadeRounds();

  return empty.map((roundBlock) => {
    const roundData = normalized.find((item) => item.round === roundBlock.round);

    return {
      ...roundBlock,
      games: roundBlock.games.map((game, index) => ({
        ...game,
        winner: roundData?.teams[index] ?? null,
      })),
    };
  });
}

export function cascadeRoundsToReadablePicks(
  rounds: CascadeRound[]
): PickRound[] {
  return normalizeReadablePicks(
    createEmptyRounds().map((round) => {
      const source = rounds.find((item) => item.round === round.round);

      return {
        round: round.round,
        teams: source?.games.map((game) => game.winner ?? "") ?? [],
      };
    })
  );
}