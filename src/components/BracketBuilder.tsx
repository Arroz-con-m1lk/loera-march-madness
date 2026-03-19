"use client";

import {
  PickRound,
  ROUND_ORDER,
  ROUND_SIZES,
  normalizeReadablePicks,
} from "../lib/bracketRounds";
import { TeamOption } from "../lib/bracket-data";
import {
  FirstRoundMatchup,
  getOptionsForGame,
  setCascadingWinner,
} from "../lib/bracketCascade";

type BracketBuilderProps = {
  rounds: PickRound[];
  onChangeRounds: (rounds: PickRound[]) => void;
  canEdit?: boolean;
  firstRoundMatchups?: FirstRoundMatchup[];
};

const FALLBACK_REGION_ORDER = ["East", "West", "South", "Midwest"] as const;

function getFallbackRegionForGame(index: number): string {
  if (index < 8) return "East";
  if (index < 16) return "West";
  if (index < 24) return "South";
  return "Midwest";
}

function getFirstRoundRegionLabel(matchup: FirstRoundMatchup | undefined, index: number) {
  if (matchup && "region" in matchup && typeof matchup.region === "string") {
    return matchup.region;
  }

  return getFallbackRegionForGame(index);
}

function getGameLabel(
  roundName: string,
  index: number,
  matchup?: FirstRoundMatchup
): string {
  if (roundName === "Round of 64") {
    return `${getFirstRoundRegionLabel(matchup, index)} · Game ${index + 1}`;
  }

  if (roundName === "Final 4") {
    if (index === 0) return "Semifinal 1 · East vs South";
    if (index === 1) return "Semifinal 2 · West vs Midwest";
  }

  if (roundName === "Championship") {
    return "National Championship";
  }

  return `Game ${index + 1}`;
}

function buildFallbackMatchups(rounds: PickRound[]): FirstRoundMatchup[] {
  const normalized = normalizeReadablePicks(rounds);
  const firstRoundName = ROUND_ORDER[0];
  const firstRound =
    normalized.find((round) => round.round === firstRoundName) ?? {
      round: firstRoundName,
      teams: [],
    };

  return Array.from({ length: ROUND_SIZES[firstRoundName] }).map((_, index) => {
    const teamA = firstRound.teams[index * 2] ?? "";
    const teamB = firstRound.teams[index * 2 + 1] ?? "";

    const teams: TeamOption[] = [teamA, teamB]
      .filter((team) => team.trim().length > 0)
      .map((team) => ({
        id: team,
        name: team,
      }));

    return {
      gameId: `${firstRoundName}-${index + 1}`,
      region: getFallbackRegionForGame(index),
      teams: [
        teams[0] ?? { id: `empty-a-${index}`, name: "" },
        teams[1] ?? { id: `empty-b-${index}`, name: "" },
      ],
    } as FirstRoundMatchup;
  });
}

export default function BracketBuilder({
  rounds,
  onChangeRounds,
  canEdit = true,
  firstRoundMatchups,
}: BracketBuilderProps) {
  const normalizedRounds = normalizeReadablePicks(rounds);

  const effectiveFirstRoundMatchups =
    firstRoundMatchups && firstRoundMatchups.length > 0
      ? firstRoundMatchups
      : buildFallbackMatchups(normalizedRounds);

  function handleSelect(roundName: string, index: number, value: string) {
    if (!canEdit) return;

    const updated = setCascadingWinner(
      normalizedRounds,
      effectiveFirstRoundMatchups,
      roundName,
      index,
      value
    );

    onChangeRounds(updated);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 shadow-2xl shadow-black/30">
      <div className="mb-6">
        <div className="text-xs font-black uppercase tracking-[0.28em] text-red-300">
          Build Your Bracket
        </div>
        <h2 className="mt-2 text-2xl font-black italic text-white">
          Round-by-Round Picks
        </h2>
        <p className="mt-2 text-sm text-neutral-400">
          Pick winners game by game. Later round options automatically come from
          your earlier picks.
        </p>
      </div>

      <div className="grid gap-5">
        {ROUND_ORDER.map((roundName) => {
          const round =
            normalizedRounds.find((r) => r.round === roundName) ?? {
              round: roundName,
              teams: [],
            };

          const slots = ROUND_SIZES[roundName];

          return (
            <div
              key={roundName}
              className="rounded-2xl border border-white/10 bg-black/30 p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="text-lg font-black text-white">{roundName}</div>
                <div className="text-xs text-neutral-500">{slots} picks</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: slots }).map((_, index) => {
                  const options = getOptionsForGame(
                    normalizedRounds,
                    effectiveFirstRoundMatchups,
                    roundName,
                    index
                  );

                  const selectedValue = round.teams[index] ?? "";
                  const isDisabled = !canEdit || options.length === 0;
                  const matchup =
                    roundName === "Round of 64"
                      ? effectiveFirstRoundMatchups[index]
                      : undefined;

                  return (
                    <div
                      key={`${roundName}-${index}`}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
                        {getGameLabel(roundName, index, matchup)}
                      </div>

                      <select
                        value={selectedValue}
                        onChange={(e) =>
                          handleSelect(roundName, index, e.target.value)
                        }
                        disabled={isDisabled}
                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ${
                          canEdit
                            ? "border-white/10 bg-neutral-950 text-white focus:border-red-400/40"
                            : "border-white/5 bg-black/40 text-neutral-500"
                        }`}
                      >
                        <option value="">
                          {options.length === 0
                            ? "Waiting on earlier picks"
                            : "Select winner"}
                        </option>

                        {options.map((team) => (
                          <option key={team.id} value={team.name}>
                            {team.seed ? `(${team.seed}) ` : ""}
                            {team.name}
                          </option>
                        ))}
                      </select>

                      {options.length > 0 && (
                        <div className="mt-2 text-xs text-neutral-500">
                          Options:{" "}
                          {options
                            .map((team) =>
                              team.seed ? `(${team.seed}) ${team.name}` : team.name
                            )
                            .join(" vs ")}
                        </div>
                      )}

                      {roundName === "Round of 64" && matchup && (
                        <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-neutral-600">
                          Region: {getFirstRoundRegionLabel(matchup, index)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}