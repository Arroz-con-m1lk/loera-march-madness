"use client";

import { useMemo, useState } from "react";

type BracketPickRound = {
  round: string;
  teams: string[];
};

export type EditableBracket = {
  id: string;
  label: string;
  image?: string;
  score: number;
  paid: boolean;
  submitted: boolean;
  locked: boolean;
  championAlive: boolean;
  championPick?: string;
  notes?: string;
  readablePicks?: BracketPickRound[];
};

type BracketEditorProps = {
  playerName: string;
  bracket: EditableBracket;
  onSave: (updatedBracket: EditableBracket) => void;
  onClose: () => void;
};

const DEFAULT_ROUNDS: BracketPickRound[] = [
  { round: "Round of 64", teams: [] },
  { round: "Round of 32", teams: [] },
  { round: "Sweet 16", teams: [] },
  { round: "Elite 8", teams: [] },
  { round: "Final 4", teams: [] },
  { round: "Championship", teams: [] },
];

function normalizePicks(
  readablePicks?: BracketPickRound[]
): BracketPickRound[] {
  if (!readablePicks || readablePicks.length === 0) {
    return DEFAULT_ROUNDS;
  }

  return DEFAULT_ROUNDS.map((defaultRound) => {
    const existing = readablePicks.find(
      (round) => round.round === defaultRound.round
    );

    return existing
      ? {
          round: existing.round,
          teams: existing.teams ?? [],
        }
      : defaultRound;
  });
}

export default function BracketEditor({
  playerName,
  bracket,
  onSave,
  onClose,
}: BracketEditorProps) {
  const [label, setLabel] = useState(bracket.label);
  const [championPick, setChampionPick] = useState(bracket.championPick ?? "");
  const [image, setImage] = useState(bracket.image ?? "");
  const [notes, setNotes] = useState(bracket.notes ?? "");
  const [readablePicks, setReadablePicks] = useState<BracketPickRound[]>(
    normalizePicks(bracket.readablePicks)
  );

  const totalEnteredTeams = useMemo(
    () =>
      readablePicks.reduce((sum, round) => {
        const count = round.teams.filter((team) => team.trim().length > 0).length;
        return sum + count;
      }, 0),
    [readablePicks]
  );

  const updateRoundText = (roundName: string, value: string) => {
    const teams = value
      .split("\n")
      .map((team) => team.trim())
      .filter(Boolean);

    setReadablePicks((current) =>
      current.map((round) =>
        round.round === roundName
          ? {
              ...round,
              teams,
            }
          : round
      )
    );
  };

  const handleSave = () => {
    onSave({
      ...bracket,
      label: label.trim() || bracket.label,
      championPick: championPick.trim(),
      image: image.trim(),
      notes: notes.trim(),
      readablePicks,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-950 shadow-[0_30px_120px_rgba(0,0,0,0.7)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/10 bg-gradient-to-r from-red-700/20 via-orange-500/10 to-red-700/20 px-6 py-5">
          <div className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
            Bracket Editor
          </div>
          <h2 className="mt-2 text-3xl font-black italic text-white">
            {playerName} • {bracket.label}
          </h2>
          <p className="mt-2 text-sm text-neutral-300">
            Enter readable bracket data here so the site can do more than just
            show an uploaded image.
          </p>
        </div>

        <div className="grid max-h-[calc(92vh-88px)] gap-0 overflow-y-auto xl:grid-cols-[0.95fr_1.05fr]">
          <div className="border-b border-white/10 p-6 xl:border-b-0 xl:border-r">
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Bracket Basics
                </div>

                <div className="mt-4 space-y-4">
                  <label className="block">
                    <div className="mb-2 text-sm font-bold text-white">
                      Bracket Label
                    </div>
                    <input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/40"
                      placeholder="Maria Main"
                    />
                  </label>

                  <label className="block">
                    <div className="mb-2 text-sm font-bold text-white">
                      Champion Pick
                    </div>
                    <input
                      value={championPick}
                      onChange={(e) => setChampionPick(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/40"
                      placeholder="UCLA"
                    />
                  </label>

                  <label className="block">
                    <div className="mb-2 text-sm font-bold text-white">
                      Bracket Image Path / URL
                    </div>
                    <input
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/40"
                      placeholder="/brackets/maria-main.png"
                    />
                  </label>

                  <label className="block">
                    <div className="mb-2 text-sm font-bold text-white">
                      Admin Notes
                    </div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={5}
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/40"
                      placeholder="Optional notes about corrections, tie-breakers, manual adjustments, etc."
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Readiness Check
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                    {championPick.trim() ? "Champion Pick Entered" : "No Champion Pick"}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                    {image.trim() ? "Image Linked" : "No Image Linked"}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                    {totalEnteredTeams} Picks Entered
                  </span>
                </div>

                <div className="mt-4 text-sm text-neutral-400">
                  This doesn’t need to be perfect yet. Even partial readable
                  picks are better than image-only mode.
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSave}
                  className="rounded-2xl border border-emerald-500/25 bg-emerald-600/15 px-4 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-600/25"
                >
                  Save Bracket
                </button>

                <button
                  onClick={onClose}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
                Readable Picks
              </div>
              <h3 className="mt-2 text-2xl font-black italic text-white">
                Round-by-round entry
              </h3>
              <p className="mt-2 text-sm text-neutral-400">
                Put one team per line for each round.
              </p>
            </div>

            <div className="grid gap-4">
              {readablePicks.map((round) => (
                <div
                  key={round.round}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="text-lg font-black text-white">{round.round}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.18em] text-neutral-500">
                    One team per line
                  </div>

                  <textarea
                    value={round.teams.join("\n")}
                    onChange={(e) => updateRoundText(round.round, e.target.value)}
                    rows={Math.max(6, round.teams.length + 2)}
                    className="mt-4 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/40"
                    placeholder={`Enter ${round.round} teams here...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}