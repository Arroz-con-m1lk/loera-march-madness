"use client";

import { isTeamStillAlive } from "@/lib/scoreBracket";
import { teamsMatch } from "@/lib/normalizeTeamName";

type PickRound = {
  round: string;
  teams: string[];
};

type BracketViewerLifeState = "alive" | "lameDuck" | "busted";

type BracketViewerCard = {
  id: string;
  playerName: string;
  label: string;
  image?: string;
  score: number;
  championAlive: boolean;
  paid: boolean;
  submitted: boolean;
  locked: boolean;
  busted?: boolean;
  championPick?: string;
  notes?: string;
  readablePicks?: PickRound[];
};

type BracketViewerModalProps = {
  bracket: BracketViewerCard | null;
  rank?: number | null;
  onClose: () => void;
  officialResults?: PickRound[];
};

function hasReadablePicks(
  bracket: Pick<BracketViewerCard, "readablePicks">
) {
  return Boolean(
    bracket.readablePicks?.some((round) =>
      round.teams.some((team) => Boolean(team?.trim()))
    )
  );
}

function getReadablePickCount(
  bracket: Pick<BracketViewerCard, "readablePicks">
) {
  return (
    bracket.readablePicks?.reduce(
      (sum, round) =>
        sum + round.teams.filter((team) => Boolean(team?.trim())).length,
      0
    ) ?? 0
  );
}

function getDerivedLifeState(
  bracket: BracketViewerCard
): BracketViewerLifeState {
  if (bracket.busted) return "busted";
  if (bracket.championAlive === false) return "lameDuck";
  return "alive";
}

function getLifeStateLabel(lifeState: BracketViewerLifeState) {
  if (lifeState === "busted") return "Busted";
  if (lifeState === "lameDuck") return "Lame Duck";
  return "Alive";
}

function getLifeStateBadgeClass(lifeState: BracketViewerLifeState) {
  if (lifeState === "busted") {
    return "bg-zinc-700 text-zinc-300";
  }

  if (lifeState === "lameDuck") {
    return "bg-yellow-500/20 text-yellow-300";
  }

  return "bg-emerald-500/20 text-emerald-300";
}

function getPickResultColor(
  team: string,
  roundName: string,
  index: number,
  officialResults?: PickRound[]
) {
  if (!officialResults) {
    return "bg-white/10 text-white";
  }

  const round = officialResults.find((r) => r.round === roundName);
  const winner = round?.teams?.[index]?.trim();

  if (winner) {
    if (teamsMatch(winner, team)) {
      return "border border-emerald-400/30 bg-emerald-500/20 text-emerald-300";
    }

    return "border border-red-400/30 bg-red-500/20 text-red-300";
  }

  if (!isTeamStillAlive(team, officialResults)) {
    return "border border-zinc-700 bg-zinc-800/70 text-zinc-400";
  }

  return "bg-white/10 text-white";
}

export default function BracketViewerModal({
  bracket,
  rank,
  onClose,
  officialResults,
}: BracketViewerModalProps) {
  if (!bracket) return null;

  const bracketImage = bracket.image ?? "/brackets/bracket-placeholder.png";
  const lifeState = getDerivedLifeState(bracket);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 p-4 md:p-6"
      onClick={onClose}
    >
      <div className="flex h-full items-center justify-center">
        <div
          className="animate-[viewerIn_220ms_ease-out] relative flex h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-950 shadow-[0_30px_120px_rgba(0,0,0,0.7)] md:h-[calc(100vh-3rem)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-700 via-orange-400 to-red-700" />
          <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-red-500/15 blur-3xl" />

          <div className="relative flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-5 md:px-8">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-red-300">
                {bracket.playerName}
              </div>
              <h2 className="mt-1 text-3xl font-black italic text-white md:text-4xl">
                {bracket.label}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Close
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
              <div className="flex flex-col gap-4">
                <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
                  <img
                    src={bracketImage}
                    alt={`${bracket.playerName} ${bracket.label}`}
                    className="w-full object-cover"
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                    Readable Bracket Snapshot
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                      {bracket.championPick
                        ? `Champion: ${bracket.championPick}`
                        : "No champion entered"}
                    </span>

                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                      {hasReadablePicks(bracket)
                        ? `${getReadablePickCount(bracket)} readable picks`
                        : "Image-first bracket"}
                    </span>
                  </div>

                  {bracket.notes ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                        Admin Notes
                      </div>
                      <div className="mt-2 text-sm text-neutral-300">
                        {bracket.notes}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                    Player Name
                  </div>
                  <div className="mt-2 text-3xl font-black italic text-white">
                    {bracket.playerName}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                    Bracket
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {bracket.label}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                      Score
                    </div>
                    <div className="mt-2 text-4xl font-black text-white">
                      {bracket.score}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                      Rank
                    </div>
                    <div className="mt-2 text-4xl font-black text-white">
                      {rank ? `#${rank}` : "Unranked"}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                    Bracket Status
                  </div>

                  <div className="mt-2 text-xl font-black uppercase text-white">
                    {getLifeStateLabel(lifeState)}
                  </div>

                  <div className="mt-3 text-sm text-neutral-300">
                    Champion:{" "}
                    <span className="font-bold text-white">
                      {bracket.championPick || "None"}
                    </span>
                    {" • "}
                    {bracket.championAlive
                      ? "Champion still alive"
                      : "Champion eliminated"}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                    Broadcast Tags
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        bracket.paid
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {bracket.paid ? "Paid" : "Not Paid"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        bracket.locked
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {bracket.locked ? "Locked" : "Unlocked"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        bracket.submitted
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {bracket.submitted ? "Submitted" : "Not Submitted"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getLifeStateBadgeClass(
                        lifeState
                      )}`}
                    >
                      {getLifeStateLabel(lifeState)}
                    </span>

                    {hasReadablePicks(bracket) ? (
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Readable Picks Loaded
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-neutral-500">
                    Readable Picks
                  </div>

                  {hasReadablePicks(bracket) ? (
                    <div className="mt-4 space-y-3">
                      {bracket.readablePicks
                        ?.filter((round) =>
                          round.teams.some((team) => Boolean(team?.trim()))
                        )
                        .map((round) => (
                          <div
                            key={round.round}
                            className="rounded-2xl border border-white/10 bg-black/30 p-4"
                          >
                            <div className="text-sm font-black uppercase tracking-[0.16em] text-red-300">
                              {round.round}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {round.teams
                                .filter((team) => Boolean(team?.trim()))
                                .map((team, index) => (
                                  <span
                                    key={`${round.round}-${team}-${index}`}
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getPickResultColor(
                                      team,
                                      round.round,
                                      index,
                                      officialResults
                                    )}`}
                                  >
                                    {team}
                                  </span>
                                ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-neutral-400">
                      No readable picks entered yet. This bracket is currently
                      image-first.
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-red-500/20 bg-gradient-to-r from-red-600/10 to-orange-500/10 p-5">
                  <div className="text-xs uppercase tracking-[0.22em] text-red-300">
                    Bracket Viewer
                  </div>
                  <div className="mt-2 text-sm text-neutral-300">
                    Sports-card spotlight mode. Press{" "}
                    <span className="font-bold text-white">ESC</span> or hit close
                    to exit.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}