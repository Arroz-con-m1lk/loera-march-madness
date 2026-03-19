import {
  PickRound,
  ROUND_ORDER,
  ROUND_SIZES,
  normalizeReadablePicks,
} from "./bracketRounds";
import { TeamOption } from "./bracket-data";

export type FirstRoundMatchup = {
  gameId: string;
  teams: TeamOption[];
};

export function getRoundTeamsMap(rounds: PickRound[]): Record<string, string[]> {
  const normalized = normalizeReadablePicks(rounds);

  return Object.fromEntries(
    normalized.map((round) => [round.round, [...round.teams]])
  );
}

export function getOptionsForGame(
  rounds: PickRound[],
  firstRoundMatchups: FirstRoundMatchup[],
  roundName: string,
  gameIndex: number
): TeamOption[] {
  const normalized = normalizeReadablePicks(rounds);
  const roundIndex = ROUND_ORDER.indexOf(roundName as (typeof ROUND_ORDER)[number]);

  if (roundIndex === -1) return [];

  if (roundIndex === 0) {
    return firstRoundMatchups[gameIndex]?.teams ?? [];
  }

  const previousRoundName = ROUND_ORDER[roundIndex - 1];
  const previousRound =
    normalized.find((round) => round.round === previousRoundName) ?? {
      round: previousRoundName,
      teams: Array.from({ length: ROUND_SIZES[previousRoundName] }, () => ""),
    };

  const feederA = previousRound.teams[gameIndex * 2] ?? "";
  const feederB = previousRound.teams[gameIndex * 2 + 1] ?? "";

  return [feederA, feederB]
    .filter((teamName) => teamName.trim().length > 0)
    .map((teamName) => ({
      id: teamName,
      name: teamName,
    }));
}

export function clearInvalidDownstreamPicks(
  rounds: PickRound[],
  firstRoundMatchups: FirstRoundMatchup[]
): PickRound[] {
  const normalized = normalizeReadablePicks(rounds);

  const nextRounds = normalized.map((round) => ({
    round: round.round,
    teams: [...round.teams],
  }));

  for (let roundIndex = 1; roundIndex < ROUND_ORDER.length; roundIndex++) {
    const roundName = ROUND_ORDER[roundIndex];
    const round = nextRounds.find((item) => item.round === roundName);

    if (!round) continue;

    for (let gameIndex = 0; gameIndex < ROUND_SIZES[roundName]; gameIndex++) {
      const options = getOptionsForGame(
        nextRounds,
        firstRoundMatchups,
        roundName,
        gameIndex
      ).map((team) => team.name);

      const currentValue = round.teams[gameIndex] ?? "";

      if (currentValue && !options.includes(currentValue)) {
        round.teams[gameIndex] = "";
      }
    }
  }

  return normalizeReadablePicks(nextRounds);
}

export function setCascadingWinner(
  rounds: PickRound[],
  firstRoundMatchups: FirstRoundMatchup[],
  roundName: string,
  gameIndex: number,
  value: string
): PickRound[] {
  const normalized = normalizeReadablePicks(rounds);

  const updated = normalized.map((round) => ({
    round: round.round,
    teams: [...round.teams],
  }));

  const targetRound = updated.find((round) => round.round === roundName);

  if (!targetRound) {
    return normalized;
  }

  targetRound.teams[gameIndex] = value;

  return clearInvalidDownstreamPicks(updated, firstRoundMatchups);
}