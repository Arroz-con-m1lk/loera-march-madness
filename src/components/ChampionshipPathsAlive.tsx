"use client";

type RankedBracketCard = {
  id: string;
  playerName: string;
  label: string;
  image?: string;
  score: number;
  championAlive: boolean;
  busted?: boolean;
  paid: boolean;
  submitted: boolean;
  locked: boolean;
  rank: number;
};

type PlayerLite = {
  name: string;
  status?: "confirmed" | "maybe" | "out";
  brackets: {
    championAlive: boolean;
    busted?: boolean;
    paid: boolean;
    locked: boolean;
  }[];
};

type ChampionshipPathsAliveProps = {
  players: PlayerLite[];
  rankedBracketCards: RankedBracketCard[];
};

function StatPill({
  label,
  value,
  accent = "red",
}: {
  label: string;
  value: string;
  accent?: "red" | "yellow" | "cyan";
}) {
  const accentClass =
    accent === "yellow"
      ? "border-yellow-400/20 bg-yellow-500/10 text-yellow-100"
      : accent === "cyan"
        ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-100"
        : "border-red-400/20 bg-red-500/10 text-red-100";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${accentClass}`}>
      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55">
        {label}
      </div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

export default function ChampionshipPathsAlive({
  players,
  rankedBracketCards,
}: ChampionshipPathsAliveProps) {
  const liveLockedBrackets = rankedBracketCards.filter(
    (card) => card.locked && card.paid && !card.busted
  );

  const lameDuckLockedBrackets = rankedBracketCards.filter(
    (card) =>
      card.locked &&
      card.paid &&
      !card.busted &&
      card.championAlive === false
  );

  const livePlayers = players.filter(
    (player) =>
      player.status !== "out" &&
      player.brackets.some(
        (bracket) => bracket.paid && bracket.locked && !bracket.busted
      )
  );

  const projectedWinner =
    [...liveLockedBrackets].sort((a, b) => a.rank - b.rank)[0] ?? null;

  const currentLeader = rankedBracketCards[0] ?? null;

  return (
    <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.28em] text-red-300">
            Championship Paths Still Alive
          </div>
          <h2 className="mt-1 text-2xl font-black italic text-white">
            Who still has a shot
          </h2>
          <p className="mt-1 text-sm text-white/55">
            Quick read on who is still breathing in the pool.
          </p>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
          March Madness Watch
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatPill
          label="Live Brackets"
          value={String(liveLockedBrackets.length)}
          accent="red"
        />
        <StatPill
          label="Players Alive"
          value={String(livePlayers.length)}
          accent="yellow"
        />
        <StatPill
          label="Lame Duck"
          value={String(lameDuckLockedBrackets.length)}
          accent="yellow"
        />
        <StatPill
          label="Projected Winner"
          value={projectedWinner ? projectedWinner.playerName : "TBD"}
          accent="cyan"
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
            Best Live Position
          </div>
          {projectedWinner ? (
            <>
              <div className="mt-2 text-2xl font-black text-white">
                {projectedWinner.playerName}
              </div>
              <div className="mt-1 text-sm text-white/65">
                {projectedWinner.label} • #{projectedWinner.rank} overall •{" "}
                {projectedWinner.score} pts
                {projectedWinner.championAlive === false && !projectedWinner.busted
                  ? " • Lame Duck"
                  : " • Alive"}
              </div>
            </>
          ) : (
            <div className="mt-2 text-sm text-white/55">
              No live title paths right now.
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-yellow-300">
            Board Read
          </div>
          <div className="mt-2 text-sm leading-6 text-white/70">
            {projectedWinner && currentLeader
              ? projectedWinner.id === currentLeader.id
                ? projectedWinner.championAlive === false && !projectedWinner.busted
                  ? `${currentLeader.playerName} is leading and still holds the cleanest remaining path, but it is now a lame duck route.`
                  : `${currentLeader.playerName} is leading and still holding the cleanest path to the crown.`
                : `${projectedWinner.playerName} has the strongest remaining live path, but ${currentLeader.playerName} still sits on top right now.`
              : "The pool will sharpen once more live results come in."}
          </div>
        </div>
      </div>
    </section>
  );
}