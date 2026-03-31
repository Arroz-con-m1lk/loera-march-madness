import type { Player } from "../data/players";

function Avatar({ player }: { player: Player }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-neutral-800">
      <img
        src={player.avatarImage}
        alt={`${player.name} avatar`}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

type LeaderboardProps = {
  players: Player[];
};

type BracketLifeState = "alive" | "lameDuck" | "busted";

type BracketEntry = {
  id: string;
  paid: boolean;
  locked: boolean;
  score: number;
  championAlive: boolean;
  busted?: boolean;
};

function getPlayerBrackets(player: Player): BracketEntry[] {
  return Array.isArray(player.brackets) ? player.brackets : [];
}

function getLockedPaidBrackets(player: Player) {
  return getPlayerBrackets(player).filter(
    (bracket) => bracket.paid && bracket.locked
  );
}

function getBestLockedScore(player: Player) {
  const lockedBrackets = getLockedPaidBrackets(player);
  if (lockedBrackets.length === 0) return 0;
  return Math.max(...lockedBrackets.map((bracket) => bracket.score));
}

function getBracketLifeState(bracket: BracketEntry): BracketLifeState {
  if (bracket.busted) return "busted";
  if (bracket.championAlive === false) return "lameDuck";
  return "alive";
}

function getLiveBracketCount(player: Player) {
  return getLockedPaidBrackets(player).filter(
    (bracket) => getBracketLifeState(bracket) !== "busted"
  ).length;
}

function getLameDuckCount(player: Player) {
  return getLockedPaidBrackets(player).filter(
    (bracket) => getBracketLifeState(bracket) === "lameDuck"
  ).length;
}

export default function Leaderboard({ players }: LeaderboardProps) {
  const confirmedPlayers = players
    .filter((player) => player.status === "confirmed")
    .slice()
    .sort((a, b) => {
      const scoreDiff = getBestLockedScore(b) - getBestLockedScore(a);
      if (scoreDiff !== 0) return scoreDiff;

      const lockedDiff =
        getLockedPaidBrackets(b).length - getLockedPaidBrackets(a).length;
      if (lockedDiff !== 0) return lockedDiff;

      return a.name.localeCompare(b.name);
    });

  return (
    <section className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.28em] text-red-300">
            Live Standings
          </div>
          <h2 className="mt-1 text-2xl font-black italic">Leaderboard</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Best locked bracket score on the board.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
          <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            Confirmed
          </div>
          <div className="mt-1 text-xl font-black text-white">
            {confirmedPlayers.length}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {confirmedPlayers.map((player, index) => {
          const lockedEntries = getLockedPaidBrackets(player);
          const liveEntries = getLiveBracketCount(player);
          const lameDuckCount = getLameDuckCount(player);
          const bestScore = getBestLockedScore(player);
          const busted = lockedEntries.length > 0 && liveEntries === 0;
          const isTopThree = index < 3;

          return (
            <div
              key={player.name}
              className={`relative overflow-hidden rounded-2xl border p-4 transition ${
                busted
                  ? "border-zinc-700 bg-zinc-900/80 grayscale"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 ${
                  isTopThree
                    ? "bg-gradient-to-r from-red-700 via-orange-400 to-red-700"
                    : "bg-white/10"
                }`}
              />

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30 text-sm font-black text-white">
                    #{index + 1}
                  </div>

                  <Avatar player={player} />

                  <div>
                    <div className="font-semibold text-white">{player.name}</div>
                    <div className="text-sm text-neutral-400">
                      {lockedEntries.length === 0
                        ? "No locked entries yet"
                        : busted
                          ? "All locked brackets busted"
                          : lameDuckCount > 0
                            ? `${liveEntries} alive (${lameDuckCount} lame duck)`
                            : `${liveEntries} live ${
                                liveEntries === 1 ? "entry" : "entries"
                              } still rolling`}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-right">
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                      Best
                    </div>
                    <div className="mt-1 text-lg font-black text-white">
                      {bestScore}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                      Locked
                    </div>
                    <div className="mt-1 text-lg font-black text-white">
                      {lockedEntries.length}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                      Alive
                    </div>
                    <div className="mt-1 text-lg font-black text-white">
                      {liveEntries}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300">
                  {lockedEntries.length} locked
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    liveEntries === 0
                      ? "bg-zinc-700 text-zinc-300"
                      : lameDuckCount > 0
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {liveEntries === 0
                    ? "Busted"
                    : lameDuckCount > 0
                      ? `${lameDuckCount} lame duck`
                      : `${liveEntries} alive`}
                </span>

                {isTopThree && (
                  <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-200">
                    Top 3
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}