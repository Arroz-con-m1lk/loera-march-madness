type RankedBracketCard = {
  id: string;
  playerName: string;
  label: string;
  image?: string;
  score: number;
  championAlive: boolean;
  paid: boolean;
  submitted: boolean;
  locked: boolean;
  rank: number;
};

type LeaderboardHeroProps = {
  rankedBracketCards: RankedBracketCard[];
  onSelectBracket: (bracketId: string) => void;
};

function InfoPill({
  label,
  value,
  glow = false,
}: {
  label: string;
  value: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        glow
          ? "border-yellow-400/30 bg-yellow-400/10 shadow-[0_0_25px_rgba(250,204,21,0.18)]"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
        {label}
      </div>
      <div className="mt-2 text-base font-black text-white md:text-lg">
        {value}
      </div>
    </div>
  );
}

export default function LeaderboardHero({
  rankedBracketCards,
  onSelectBracket,
}: LeaderboardHeroProps) {
  const currentLeader = rankedBracketCards[0];

  const projectedWinner =
    rankedBracketCards.find((bracket) => bracket.championAlive) ??
    rankedBracketCards[0];

  if (!currentLeader) return null;

  const leaderImage = currentLeader.image;
  const projectedIsSame = projectedWinner?.id === currentLeader.id;

  return (
    <section className="rounded-[2rem] border border-yellow-400/20 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black p-6 shadow-[0_0_50px_rgba(234,179,8,0.08)]">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.28em] text-yellow-300">
            Championship Desk
          </div>
          <h2 className="mt-1 text-3xl font-black italic text-white">
            Leaderboard Spotlight
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/60">
            Current leader at the top, plus the best-positioned live bracket still
            breathing.
          </p>
        </div>

        <div className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-100">
          {rankedBracketCards.length} ranked bracket
          {rankedBracketCards.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-yellow-400/25 bg-gradient-to-br from-yellow-500/12 via-red-500/8 to-neutral-950 p-5 shadow-[0_0_45px_rgba(250,204,21,0.14)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500" />
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-yellow-300/10 blur-3xl" />
          <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.26em] text-yellow-300">
                Current Leader
              </div>
              <div className="mt-1 text-4xl font-black italic text-white">
                #{currentLeader.rank}
              </div>
            </div>

            <div className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-100">
              Top of the Pool
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[180px_1fr]">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
              {leaderImage ? (
                <img
                  src={leaderImage}
                  alt={`${currentLeader.playerName} bracket`}
                  className="h-[220px] w-full object-cover"
                />
              ) : (
                <div className="flex h-[220px] items-center justify-center bg-neutral-900 text-5xl font-black text-white/40">
                  {currentLeader.playerName.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="text-sm font-black uppercase tracking-[0.22em] text-white/45">
                Bracket Owner
              </div>
              <div className="mt-1 text-3xl font-black text-white">
                {currentLeader.playerName}
              </div>
              <div className="mt-1 text-lg font-semibold text-yellow-100/90">
                {currentLeader.label}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <InfoPill label="Score" value={`${currentLeader.score} pts`} glow />
                <InfoPill
                  label="Champion"
                  value={currentLeader.championAlive ? "Still Alive" : "Eliminated"}
                />
                <InfoPill
                  label="Entry Status"
                  value={
                    currentLeader.locked && currentLeader.submitted
                      ? "Locked + Submitted"
                      : "Still Open"
                  }
                />
                <InfoPill
                  label="Payment"
                  value={currentLeader.paid ? "Paid" : "Not Paid"}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => onSelectBracket(currentLeader.id)}
                  className="rounded-xl bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-black shadow-[0_10px_30px_rgba(249,115,22,0.25)]"
                >
                  Open Leader Bracket
                </button>

                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/75">
                  Hottest bracket in the building right now
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 via-neutral-950 to-black p-5 shadow-[0_0_40px_rgba(34,211,238,0.10)]">
          <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-300">
            Projected Winner Tracker
          </div>
          <h3 className="mt-2 text-2xl font-black italic text-white">
            {projectedIsSame ? "Leader favored to finish on top" : "Best live position"}
          </h3>

          <p className="mt-2 text-sm leading-6 text-white/60">
            This projection uses the best-ranked bracket that still has its champion
            alive. It&apos;s a simple live-position tracker, not a full probability model.
          </p>

          {projectedWinner ? (
            <div className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                    Projected Winner
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">
                    {projectedWinner.playerName}
                  </div>
                  <div className="mt-1 text-base font-semibold text-cyan-100/90">
                    {projectedWinner.label}
                  </div>
                </div>

                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-black text-cyan-200">
                  #{projectedWinner.rank}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoPill label="Current Score" value={`${projectedWinner.score} pts`} />
                <InfoPill
                  label="Champion Path"
                  value={projectedWinner.championAlive ? "Alive" : "Dead"}
                />
                <InfoPill
                  label="Compared to Leader"
                  value={
                    projectedWinner.id === currentLeader.id
                      ? "Same bracket"
                      : `${Math.max(
                          0,
                          currentLeader.score - projectedWinner.score
                        )} pts back`
                  }
                />
                <InfoPill
                  label="Status"
                  value={
                    projectedWinner.locked && projectedWinner.submitted
                      ? "Eligible"
                      : "Needs review"
                  }
                />
              </div>

              <button
                onClick={() => onSelectBracket(projectedWinner.id)}
                className="mt-4 w-full rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Open Projected Winner
              </button>
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/50">
              No projected winner available yet.
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
              Read of the board
            </div>
            <div className="mt-2 text-sm leading-6 text-white/70">
              {projectedIsSame
                ? "The current leader still has the cleanest path. Everybody else is chasing."
                : `${projectedWinner.playerName} is the most dangerous live bracket even if they are not leading this second.`}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}