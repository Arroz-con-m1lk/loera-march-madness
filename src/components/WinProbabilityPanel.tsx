"use client";

type RankedBracketCard = {
  id: string;
  playerName: string;
  label: string;
  score: number;
  championAlive: boolean;
  paid: boolean;
  submitted: boolean;
  locked: boolean;
  rank: number;
};

type ProbabilityRow = {
  name: string;
  probability: number;
};

function buildProbabilities(cards: RankedBracketCard[]): ProbabilityRow[] {
  const eligible = cards.filter((card) => card.paid && card.locked);

  if (eligible.length === 0) return [];

  const weighted = eligible.map((card) => {
    let scoreWeight = Math.max(1, 120 - card.rank * 10);
    if (card.championAlive) scoreWeight += 35;
    scoreWeight += Math.max(0, card.score);

    return {
      name: card.playerName,
      weight: scoreWeight,
    };
  });

  const totals = weighted.reduce<Record<string, number>>((acc, row) => {
    acc[row.name] = (acc[row.name] ?? 0) + row.weight;
    return acc;
  }, {});

  const totalWeight = Object.values(totals).reduce((sum, value) => sum + value, 0);

  return Object.entries(totals)
    .map(([name, weight]) => ({
      name,
      probability: Math.round((weight / totalWeight) * 100),
    }))
    .sort((a, b) => b.probability - a.probability);
}

export default function WinProbabilityPanel({
  rankedBracketCards,
}: {
  rankedBracketCards: RankedBracketCard[];
}) {
  const rows = buildProbabilities(rankedBracketCards);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Win Probability
          </div>
          <h2 className="mt-1 text-2xl font-black italic text-white">
            Who has the best shot
          </h2>
          <p className="mt-1 text-sm text-white/55">
            Broadcast-style estimated odds based on rank, score, and live champion paths.
          </p>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
          Pool Forecast
        </div>
      </div>

      <div className="space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/55">
            No locked brackets yet.
          </div>
        ) : (
          rows.map((row) => (
            <div key={row.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-lg font-black text-white">{row.name}</div>
                <div className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
                  {row.probability}%
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 transition-all duration-700"
                  style={{ width: `${row.probability}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}