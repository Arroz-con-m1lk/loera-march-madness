import type { Player } from "../data/players";

type BracketEntry = {
  id: string;
  label: string;
  image?: string;
  paid: boolean;
  submitted: boolean;
  locked: boolean;
  score: number;
  championAlive: boolean;
  busted?: boolean;
  championPick?: string;
  notes?: string;
  readablePicks?: {
    round: string;
    teams: string[];
  }[];
};

type ExtendedPlayer = Player & {
  brackets?: BracketEntry[];
  bracketCardImage?: string;
};

function normalizeStatus(status?: Player["status"]) {
  if (status === "maybe" || status === "out" || status === "confirmed") {
    return status;
  }

  return "confirmed";
}

function Avatar({
  player,
  size = "lg",
}: {
  player: Player;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-20 w-20",
  };

  return (
    <div
      className={`${sizeMap[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-neutral-800`}
    >
      <img
        src={player.avatarImage}
        alt={`${player.name} avatar`}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function getPlayerBrackets(player: Player): BracketEntry[] {
  const p = player as ExtendedPlayer;

  if (Array.isArray(p.brackets) && p.brackets.length > 0) {
    return p.brackets.slice(0, 4);
  }

  return [
    {
      id: `${player.name.toLowerCase()}-1`,
      label: "Bracket 1",
      image: p.bracketCardImage ?? player.avatarImage,
      paid: player.paid,
      submitted: player.submitted,
      locked: player.submitted,
      score: player.score,
      championAlive: player.championAlive,
      busted: false,
    },
  ];
}

function getLockedPaidBrackets(player: Player) {
  return getPlayerBrackets(player).filter(
    (bracket) => bracket.paid && bracket.locked
  );
}

function getBestScore(player: Player) {
  const brackets = getPlayerBrackets(player);
  if (brackets.length === 0) return 0;
  return Math.max(...brackets.map((b) => b.score));
}

function getLiveBracketCount(player: Player) {
  return getPlayerBrackets(player).filter((b) => !b.busted).length;
}

function getBracketStatus(bracket?: BracketEntry) {
  if (!bracket) {
    return {
      label: "Open",
      detail: "Open slot",
      badgeClass: "bg-neutral-700 text-neutral-300",
      rowClass: "border-dashed border-white/10 bg-black/20 text-neutral-400",
    };
  }

  if (bracket.locked) {
    return {
      label: "Locked",
      detail: "Paid and locked",
      badgeClass: "bg-cyan-500/20 text-cyan-300",
      rowClass: "border-cyan-500/20 bg-cyan-500/10 text-white",
    };
  }

  if (bracket.submitted) {
    return {
      label: "Submitted",
      detail: "Submitted, not locked",
      badgeClass: "bg-purple-500/20 text-purple-300",
      rowClass: "border-purple-500/20 bg-purple-500/10 text-white",
    };
  }

  if (bracket.paid) {
    return {
      label: "Paid",
      detail: "Paid, not submitted",
      badgeClass: "bg-emerald-500/20 text-emerald-300",
      rowClass: "border-emerald-500/20 bg-emerald-500/10 text-white",
    };
  }

  return {
    label: "Open",
    detail: "Open slot",
    badgeClass: "bg-neutral-700 text-neutral-300",
    rowClass: "border-white/10 bg-white/5 text-neutral-300",
  };
}

function getBestBracketIdForPlayer(
  player: Player,
  bracketRankMap: Record<string, number>
) {
  const brackets = getPlayerBrackets(player);

  if (brackets.length === 0) return player.name;

  const rankedLockedPaidBrackets = brackets
    .filter((bracket) => bracket.paid && bracket.locked)
    .sort((a, b) => {
      const rankA = bracketRankMap[a.id] ?? Number.MAX_SAFE_INTEGER;
      const rankB = bracketRankMap[b.id] ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    });

  if (rankedLockedPaidBrackets.length > 0) {
    return rankedLockedPaidBrackets[0].id;
  }

  const rankedPaidBrackets = brackets
    .filter((bracket) => bracket.paid)
    .sort((a, b) => {
      const rankA = bracketRankMap[a.id] ?? Number.MAX_SAFE_INTEGER;
      const rankB = bracketRankMap[b.id] ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    });

  if (rankedPaidBrackets.length > 0) {
    return rankedPaidBrackets[0].id;
  }

  const rankedLockedOnly = brackets
    .filter((bracket) => bracket.locked)
    .sort((a, b) => {
      const rankA = bracketRankMap[a.id] ?? Number.MAX_SAFE_INTEGER;
      const rankB = bracketRankMap[b.id] ?? Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    });

  if (rankedLockedOnly.length > 0) {
    return rankedLockedOnly[0].id;
  }

  return brackets[0].id;
}

function getEditableBracketsForPlayer(player: Player) {
  const brackets = getPlayerBrackets(player);

  const paidUnlocked = brackets.filter(
    (bracket) => bracket.paid && !bracket.locked
  );
  if (paidUnlocked.length > 0) return paidUnlocked;

  const unlocked = brackets.filter((bracket) => !bracket.locked);
  return unlocked;
}

function hasReadablePicks(bracket?: BracketEntry) {
  return Boolean(
    bracket?.readablePicks?.some((round) =>
      round.teams.some((team) => team.trim().length > 0)
    )
  );
}

function isViewableBracket(bracket?: BracketEntry) {
  if (!bracket) return false;

  return (
    bracket.submitted ||
    bracket.locked ||
    bracket.paid ||
    hasReadablePicks(bracket) ||
    Boolean(bracket.championPick?.trim()) ||
    Boolean(bracket.notes?.trim())
  );
}

function getStatusVisual(status?: Player["status"]) {
  const safeStatus = normalizeStatus(status);

  if (safeStatus === "maybe") {
    return {
      icon: "?",
      label: "Maybe",
      chipClass: "bg-yellow-500/20 text-yellow-300 border-yellow-400/20",
    };
  }

  if (safeStatus === "out") {
    return {
      icon: "✕",
      label: "Out",
      chipClass: "bg-red-500/20 text-red-300 border-red-400/20",
    };
  }

  return {
    icon: "✓",
    label: "Confirmed",
    chipClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/20",
  };
}

function getPaymentVisual(player: Player) {
  const hasPaid = getPlayerBrackets(player).some((b) => b.paid);

  return {
    icon: "✓",
    label: hasPaid ? "Paid" : "Not Paid",
    chipClass: hasPaid
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/20"
      : "bg-yellow-500/20 text-yellow-300 border-yellow-400/20",
  };
}

function getSubmissionVisual(player: Player) {
  const hasLockedAndSubmitted = getPlayerBrackets(player).some(
    (b) => b.locked && b.submitted
  );

  return {
    icon: "✓",
    label: hasLockedAndSubmitted
      ? "Locked + Submitted"
      : "Not Locked / Submitted",
    chipClass: hasLockedAndSubmitted
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/20"
      : "bg-yellow-500/20 text-yellow-300 border-yellow-400/20",
  };
}

type PlayerGridProps = {
  players: Player[];
  bracketRankMap: Record<string, number>;
  onSelectBracket: (name: string) => void;
  onToggleOutStatus: (name: string) => void;
  onToggleBusted: (name: string) => void;
  onGenerateGrandmaBracket: () => void;
  onEditBracket?: (id: string) => void;
  currentViewerName?: string;
  isAdmin?: boolean;
};

function EntryDots({ count }: { count: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 4 }).map((_, index) => {
        const active = index < count;

        return (
          <span
            key={index}
            className={`h-2.5 w-2.5 rounded-full ${
              active
                ? "bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.7)]"
                : "bg-white/15"
            }`}
          />
        );
      })}
    </div>
  );
}

function BracketPreviewStrip({
  player,
  bracketRankMap,
  onSelectBracket,
}: {
  player: Player;
  bracketRankMap: Record<string, number>;
  onSelectBracket: (id: string) => void;
}) {
  const brackets = getPlayerBrackets(player);

  return (
    <div className="grid gap-2">
      {Array.from({ length: 4 }).map((_, index) => {
        const bracket = brackets[index];
        const status = getBracketStatus(bracket);
        const busted = bracket ? !!bracket.busted : false;
        const canView = isViewableBracket(bracket);

        return (
          <button
            key={bracket?.id ?? `empty-${index}`}
            type="button"
            onClick={() => {
              if (bracket && canView) onSelectBracket(bracket.id);
            }}
            disabled={!canView}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
              status.rowClass
            } ${canView ? "cursor-pointer hover:brightness-110" : "cursor-default"}`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                  #{bracket ? bracketRankMap[bracket.id] ?? "-" : "-"}
                </span>
                <div className="font-bold">
                  {bracket ? bracket.label : `Bracket ${index + 1}`}
                </div>
              </div>

              <div className="mt-0.5 text-[11px] text-neutral-400">
                {status.detail}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {bracket && (
                <div className="text-right">
                  <div className="font-black">{bracket.score} pts</div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-[0.18em]">
                    {busted ? "Busted" : "Alive"}
                  </div>
                </div>
              )}

              <span
                className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${status.badgeClass}`}
              >
                {status.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PlayerCard({
  player,
  bracketRankMap,
  onSelectBracket,
  onToggleOutStatus,
  onToggleBusted,
  onEditBracket,
  currentViewerName,
  isAdmin = false,
}: {
  player: Player;
  bracketRankMap: Record<string, number>;
  onSelectBracket: (name: string) => void;
  onToggleOutStatus: (name: string) => void;
  onToggleBusted: (name: string) => void;
  onEditBracket?: (id: string) => void;
  currentViewerName?: string;
  isAdmin?: boolean;
}) {
  const brackets = getPlayerBrackets(player);
  const lockedPaidBrackets = getLockedPaidBrackets(player);
  const paidBracketCount = brackets.filter((b) => b.paid).length;
  const bestScore = getBestScore(player);
  const liveBracketCount = getLiveBracketCount(player);
  const bestBracketId = getBestBracketIdForPlayer(player, bracketRankMap);
  const editableBrackets = getEditableBracketsForPlayer(player);

  const statusVisual = getStatusVisual(player.status);
  const paymentVisual = getPaymentVisual(player);
  const submissionVisual = getSubmissionVisual(player);

  const safeStatus = normalizeStatus(player.status);
  const isOut = safeStatus === "out";
  const isBusted = liveBracketCount === 0 && safeStatus === "confirmed";
  const isOwnCard =
    currentViewerName?.trim().toLowerCase() ===
    player.name.trim().toLowerCase();
  const canEditOwnBracket = Boolean(
    isOwnCard && editableBrackets.length > 0 && onEditBracket
  );

  const heroImage =
    lockedPaidBrackets[0]?.image ?? brackets[0]?.image ?? player.avatarImage;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition duration-200 ${
        isOut
          ? "border-neutral-700 bg-neutral-900/70 opacity-50 grayscale"
          : isBusted
            ? "border-neutral-700 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 opacity-70 grayscale-[0.65] saturate-50"
            : safeStatus === "maybe"
              ? "border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-neutral-950 to-neutral-900 hover:-translate-y-1 hover:shadow-2xl"
              : "border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black hover:-translate-y-1 hover:shadow-2xl"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-orange-400 to-red-600" />

      {isOut && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/65">
          <span className="rounded-full border border-red-500/40 bg-red-500/15 px-5 py-2 text-xl font-black tracking-[0.3em] text-red-400">
            RIP
          </span>
        </div>
      )}

      {isBusted && !isOut && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute left-1/2 top-1/2 w-[95%] -translate-x-1/2 -translate-y-1/2 -rotate-[24deg] border-y-4 border-neutral-300/25 bg-black/70 py-4 text-center shadow-[0_0_40px_rgba(0,0,0,0.65)]">
            <span className="block text-3xl font-black uppercase tracking-[0.28em] text-neutral-100 md:text-4xl">
              Busted
            </span>
          </div>
        </div>
      )}

      {player.grandmaMode && (
        <div className="absolute right-4 top-4 z-10 rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-black shadow-lg">
          👑 Grandma Mode
        </div>
      )}

      <div className="flex min-h-[290px] flex-col md:min-h-[320px] md:flex-row">
        <div className="relative md:w-[190px] lg:w-[210px]">
          <img
            src={heroImage}
            alt={`${player.name} bracket card`}
            className="h-[240px] w-full object-cover md:h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="mt-1 text-2xl font-black italic text-white">
              {player.name}
            </div>
            <div className="mt-1 text-sm text-neutral-300">
              {player.grandmaMode
                ? "AI bracket menace"
                : safeStatus === "out"
                  ? "Not joining"
                  : safeStatus === "maybe"
                    ? "Game-time decision"
                    : "Confirmed entry holder"}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="mt-1 text-2xl font-black italic text-white">
                {player.name}
              </h3>
              <p className="mt-1 text-sm text-neutral-400">
                Multi-bracket tracking with per-slot status.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-500">
                Paid Entries
              </div>
              <div className="mt-2 flex items-center gap-3">
                <EntryDots count={paidBracketCount} />
                <span className="text-sm font-bold text-white">
                  {paidBracketCount}/4
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="flex min-h-[132px] flex-col justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                Best Score
              </div>
              <div className="mt-3 text-3xl font-black leading-none text-white">
                {bestScore}
              </div>
            </div>

            <div className="flex min-h-[132px] flex-col justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                Locked
              </div>
              <div className="mt-3 text-3xl font-black leading-none text-white">
                {lockedPaidBrackets.length}
              </div>
            </div>

            <div className="flex min-h-[132px] flex-col justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                Still Alive
              </div>
              <div className="mt-3 text-3xl font-black leading-none text-white">
                {liveBracketCount}
              </div>
            </div>

            <div className="flex min-h-[132px] flex-col justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
                Status
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg font-black ${statusVisual.chipClass}`}
                >
                  {statusVisual.icon}
                </span>
                <span className="text-sm font-black uppercase tracking-[0.12em] text-white xl:text-base">
                  {statusVisual.label}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span
              className={`rounded-full border px-3 py-1 ${statusVisual.chipClass}`}
            >
              {statusVisual.icon} {statusVisual.label}
            </span>

            <span
              className={`rounded-full border px-3 py-1 ${paymentVisual.chipClass}`}
            >
              {paymentVisual.icon} {paymentVisual.label}
            </span>

            <span
              className={`rounded-full border px-3 py-1 ${submissionVisual.chipClass}`}
            >
              {submissionVisual.icon} {submissionVisual.label}
            </span>

            <span className="rounded-full bg-red-500/15 px-3 py-1 text-red-200">
              Up to 4 brackets
            </span>

            {player.grandmaMode && (
              <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-yellow-200">
                AI Grandma
              </span>
            )}
          </div>

          {player.grandmaMode && (
            <div className="mb-4 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 px-4 py-3 text-xs text-yellow-200">
              AI-generated bracket locked for fairness. Sprinkle of trash talk
              included. “Business is business.”
            </div>
          )}

          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-bold uppercase tracking-[0.18em] text-neutral-400">
                Brackets
              </div>
              <div className="text-xs text-neutral-500">Slots 1 through 4</div>
            </div>
            <BracketPreviewStrip
              player={player}
              bracketRankMap={bracketRankMap}
              onSelectBracket={onSelectBracket}
            />
          </div>

          <div className="mt-auto space-y-2">
            <div
              className={`grid gap-2 ${
                isAdmin ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              <button
                onClick={() => onSelectBracket(bestBracketId)}
                className="rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-lg shadow-red-900/30"
              >
                Open Top Bracket
              </button>

              {isAdmin && (
                <button
                  onClick={() => onToggleOutStatus(player.name)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                >
                  {isOut ? "Undo RIP" : "Mark RIP"}
                </button>
              )}
            </div>

            {!isAdmin && canEditOwnBracket && onEditBracket && (
              <div className="grid gap-2 sm:grid-cols-2">
                {editableBrackets.map((bracket) => (
                  <button
                    key={bracket.id}
                    onClick={() => onEditBracket(bracket.id)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    Edit {bracket.label}
                  </button>
                ))}
              </div>
            )}

            {isAdmin && safeStatus === "confirmed" && (
              <button
                onClick={() => onToggleBusted(player.name)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
              >
                {isBusted ? "Revive Brackets" : "Mark All Brackets Busted"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayerGrid({
  players,
  bracketRankMap,
  onSelectBracket,
  onToggleOutStatus,
  onToggleBusted,
  onGenerateGrandmaBracket,
  onEditBracket,
  currentViewerName,
  isAdmin = false,
}: PlayerGridProps) {
  const confirmedPlayers = players.filter(
    (p) => normalizeStatus(p.status) === "confirmed"
  );
  const maybePlayers = players.filter(
    (p) => normalizeStatus(p.status) === "maybe"
  );
  const outPlayers = players.filter((p) => normalizeStatus(p.status) === "out");

  const bustedPlayers = players.filter(
    (p) =>
      getLiveBracketCount(p) === 0 && normalizeStatus(p.status) === "confirmed"
  );

  const grandmaPlayer = players.find((p) => p.grandmaMode);

  const totalLockedEntries = players.reduce(
    (sum, player) => sum + getLockedPaidBrackets(player).length,
    0
  );

  return (
    <>
      <section className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 shadow-2xl shadow-black/30">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-red-300">
              Elimination Watch
            </div>
            <h2 className="mt-1 text-2xl font-black italic">
              Bracket Death Tracker
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              For the people whose title hopes got clipped early. Respectfully.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
            {bustedPlayers.length} player
            {bustedPlayers.length === 1 ? "" : "s"} in the graveyard
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-yellow-300">
              Grandma AI
            </div>
            <div className="mt-2 text-xl font-bold">Business is business</div>
            <p className="mt-2 text-sm text-yellow-100/80">
              Auto-generate Grandma&apos;s bracket so it stays fair, untampered,
              and suspiciously dangerous.
            </p>

            {isAdmin ? (
              <button
                onClick={onGenerateGrandmaBracket}
                className="mt-4 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black text-black"
              >
                Generate Grandma AI Bracket
              </button>
            ) : (
              <div className="mt-4 rounded-xl border border-yellow-400/20 bg-black/20 px-4 py-2 text-sm text-yellow-100">
                Admin only
              </div>
            )}

            {grandmaPlayer?.aiGenerated && (
              <div className="mt-3 rounded-xl border border-yellow-400/20 bg-black/20 p-3 text-xs text-yellow-100">
                Locked strategy: {grandmaPlayer.bracketStyle}. Grandma did not
                consult anyone. She consulted fate.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Bracket Graveyard</h3>
              <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                cold world
              </span>
            </div>

            {bustedPlayers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-neutral-400">
                No dead brackets yet. Everybody still pretending they know ball.
              </div>
            ) : (
              <div className="space-y-3">
                {bustedPlayers.map((player) => (
                  <div
                    key={player.name}
                    className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900/80 p-3 grayscale"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar player={player} size="sm" />
                      <div>
                        <div className="font-semibold">{player.name}</div>
                        <div className="text-xs text-neutral-500">
                          No live entries left • tournament dreams cooked
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-white">
                      ☠ {getBestScore(player)} pts best
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 shadow-2xl shadow-black/30">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-red-300">
              Pool Lineup
            </div>
            <h2 className="mt-1 text-2xl font-black italic">
              Player Status Board
            </h2>
            <p className="mt-1 text-sm text-neutral-400">The Competitors</p>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
            {totalLockedEntries} locked entries • max 4 per player
          </div>
        </div>

        <div className="mb-8">
          <h3 className="mb-3 text-lg font-semibold text-white">
            Confirmed Players
          </h3>
          <div className="grid gap-5 md:grid-cols-2">
            {confirmedPlayers.map((player) => (
              <PlayerCard
                key={player.name}
                player={player}
                bracketRankMap={bracketRankMap}
                onSelectBracket={onSelectBracket}
                onToggleOutStatus={onToggleOutStatus}
                onToggleBusted={onToggleBusted}
                onEditBracket={onEditBracket}
                currentViewerName={currentViewerName}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="mb-3 text-lg font-semibold text-white">
            Maybe Players
          </h3>
          <div className="grid gap-5 md:grid-cols-2">
            {maybePlayers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-neutral-400">
                No maybe players right now.
              </div>
            ) : (
              maybePlayers.map((player) => (
                <PlayerCard
                  key={player.name}
                  player={player}
                  bracketRankMap={bracketRankMap}
                  onSelectBracket={onSelectBracket}
                  onToggleOutStatus={onToggleOutStatus}
                  onToggleBusted={onToggleBusted}
                  onEditBracket={onEditBracket}
                  currentViewerName={currentViewerName}
                  isAdmin={isAdmin}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-white">RIP Corner</h3>
          <div className="grid gap-5 md:grid-cols-2">
            {outPlayers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-neutral-400">
                Nobody has been marked RIP yet. Miracles happen.
              </div>
            ) : (
              outPlayers.map((player) => (
                <PlayerCard
                  key={player.name}
                  player={player}
                  bracketRankMap={bracketRankMap}
                  onSelectBracket={onSelectBracket}
                  onToggleOutStatus={onToggleOutStatus}
                  onToggleBusted={onToggleBusted}
                  onEditBracket={onEditBracket}
                  currentViewerName={currentViewerName}
                  isAdmin={isAdmin}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}