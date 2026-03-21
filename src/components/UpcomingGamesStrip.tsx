"use client";

import { useEffect, useMemo, useState } from "react";

type GameCard = {
  id: string;
  awayTeam: string;
  homeTeam: string;
  awaySeed?: string;
  homeSeed?: string;
  awayRank?: string;
  homeRank?: string;
  awayLink: string;
  homeLink: string;
  dateLabel: string;
  timeLabel: string;
  epoch: number;
  gameState: string;
};

type ApiResponse = {
  games: GameCard[];
  liveGames: GameCard[];
  updatedAt?: string;
  error?: string;
};

function TeamLink({
  href,
  seed,
  rank,
  name,
}: {
  href: string;
  seed?: string;
  rank?: string;
  name: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-black text-white transition hover:text-yellow-300"
    >
      {rank ? (
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-red-300">
          #{rank}
        </span>
      ) : null}

      {seed ? (
        <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-black text-white/75">
          {seed}
        </span>
      ) : null}

      <span>{name}</span>
    </a>
  );
}

function formatPacificTime(epoch: number) {
  const date = new Date(epoch);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  }).format(date);
}

function GameChip({ game }: { game: GameCard }) {
  const pacificTime = formatPacificTime(game.epoch);

  return (
    <div className="flex items-center gap-3 whitespace-nowrap rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      <div className="flex items-center gap-2">
        <TeamLink
          href={game.awayLink}
          seed={game.awaySeed}
          rank={game.awayRank}
          name={game.awayTeam}
        />
        <span className="text-white/35">vs</span>
        <TeamLink
          href={game.homeLink}
          seed={game.homeSeed}
          rank={game.homeRank}
          name={game.homeTeam}
        />
      </div>

      <span className="text-white/20">|</span>

      <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/65">
        {game.dateLabel}
      </div>

      <span className="text-white/20">•</span>

      <div className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-red-100">
        {pacificTime} PT
      </div>
    </div>
  );
}

function formatLiveState(gameState: string) {
  return gameState.replace(/^STATUS_/, "").split("_").join(" ");
}

export default function UpcomingGamesStrip() {
  const [games, setGames] = useState<GameCard[]>([]);
  const [liveGames, setLiveGames] = useState<GameCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadGames() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/upcoming-games", {
          cache: "no-store",
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Failed to load upcoming games (${response.status}): ${text.slice(
              0,
              120
            )}`
          );
        }

        const contentType = response.headers.get("content-type") ?? "";

        if (!contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(
            `Expected JSON but received: ${
              contentType || "unknown"
            } ${text.slice(0, 120)}`
          );
        }

        const data = (await response.json()) as ApiResponse;

        if (!active) return;

        setGames(Array.isArray(data.games) ? data.games : []);
        setLiveGames(Array.isArray(data.liveGames) ? data.liveGames : []);

        if (data.error) {
          setError(data.error);
        }
      } catch (err) {
        if (!active) return;

        console.error("UpcomingGamesStrip load error:", err);

        setGames([]);
        setLiveGames([]);
        setError("Could not load games.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadGames();

    const interval = window.setInterval(loadGames, 5 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const scrollingGames = useMemo(() => {
    if (games.length === 0) return [];
    return [...games, ...games];
  }, [games]);

  const tickerDuration = useMemo(() => {
    const gameCount = Math.max(games.length, 1);
    return `${Math.max(60, gameCount * 12)}s`;
  }, [games.length]);

  return (
    <>
      {liveGames.length > 0 && (
        <section className="border-b border-red-500/15 bg-gradient-to-r from-red-900/55 via-red-800/45 to-orange-700/40 shadow-[0_8px_28px_rgba(220,38,38,0.14)]">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 md:px-6">
            <div className="flex items-center justify-center">
              <div className="live-alert-pulse rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-red-50">
                Live Now
              </div>
            </div>

            <div className="flex min-w-0 flex-wrap items-center justify-center gap-3 text-sm md:text-base">
              {liveGames.map((game, index) => (
                <div
                  key={game.id}
                  className="flex min-w-0 items-center gap-2 text-white"
                >
                  <TeamLink
                    href={game.awayLink}
                    seed={game.awaySeed}
                    rank={game.awayRank}
                    name={game.awayTeam}
                  />
                  <span className="text-white/40">vs</span>
                  <TeamLink
                    href={game.homeLink}
                    seed={game.homeSeed}
                    rank={game.homeRank}
                    name={game.homeTeam}
                  />
                  <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-red-100">
                    {formatLiveState(game.gameState)}
                  </span>
                  {index < liveGames.length - 1 && (
                    <span className="ml-1 text-white/35">•</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-y border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="border-b border-white/10 bg-gradient-to-r from-red-800/85 via-red-700/75 to-orange-600/75 px-4 py-2.5 text-center text-[11px] font-black uppercase tracking-[0.28em] text-white">
          Upcoming Games
        </div>

        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {loading ? (
            <div className="px-5 py-3 text-sm text-neutral-400">
              Loading upcoming games…
            </div>
          ) : error && games.length === 0 ? (
            <div className="px-5 py-3 text-sm text-neutral-400">{error}</div>
          ) : games.length === 0 ? (
            <div className="px-5 py-3 text-sm text-neutral-400">
              No upcoming games found.
            </div>
          ) : (
            <div
              className={`games-ticker-track flex min-w-max items-center gap-4 px-5 py-3 ${
                paused ? "is-paused" : ""
              }`}
              style={{ animationDuration: tickerDuration }}
            >
              {scrollingGames.map((game, index) => (
                <GameChip key={`${game.id}-${index}`} game={game} />
              ))}
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .games-ticker-track {
          animation-name: upcomingGamesScroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-duration: 72s;
          will-change: transform;
        }

        .games-ticker-track:hover,
        .games-ticker-track.is-paused {
          animation-play-state: paused;
        }

        .live-alert-pulse {
          animation: liveAlertPulse 1.4s ease-in-out infinite;
        }

        @keyframes upcomingGamesScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes liveAlertPulse {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(255, 255, 255, 0);
          }
          50% {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.14);
          }
        }
      `}</style>
    </>
  );
}