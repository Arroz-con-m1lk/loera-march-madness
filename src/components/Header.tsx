import AnimatedPot from "./AnimatedPot";

type HeaderProps = {
  entryFee: number;
  currentPot: number;
  submittedCount: number;
  paidCount: number;
};

export default function Header({
  entryFee,
  currentPot,
  submittedCount,
  paidCount,
}: HeaderProps) {
  return (
    <header className="border-b border-white/10 bg-gradient-to-b from-orange-500/15 to-transparent">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-block rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
              Family • Friends • Bragging Rights
            </p>

            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Loera March Madness
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-300 md:text-lg">
              Trash talk, lock brackets, let dreams collapse, and let Grandma&apos;s
              AI bracket quietly terrorize the field.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:w-[360px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20">
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                Entry Fee
              </div>
              <div className="mt-2 text-2xl font-bold">${entryFee}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20">
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                Current Pot
              </div>
              <div className="mt-2 text-2xl font-bold">
                $<AnimatedPot value={currentPot} />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20">
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                Submitted
              </div>
              <div className="mt-2 text-2xl font-bold">{submittedCount}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20">
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                Paid
              </div>
              <div className="mt-2 text-2xl font-bold">{paidCount}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}