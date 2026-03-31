"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LoginGate from "../components/LoginGate";
import Header from "../components/Header";
import ChatBox from "../components/ChatBox";
import Leaderboard from "../components/Leaderboard";
import PlayerGrid from "../components/PlayerGrid";
import LeaderboardHero from "../components/LeaderboardHero";
import UpcomingGamesStrip from "../components/UpcomingGamesStrip";
import ChampionshipPathsAlive from "../components/ChampionshipPathsAlive";
import BracketDeathAlerts from "../components/BracketDeathAlerts";
import LiveAlertsBar from "../components/LiveAlertsBar";
import WinProbabilityPanel from "../components/WinProbabilityPanel";
import BracketViewerModal from "../components/BracketViewerModal";
import { teamsMatch } from "../lib/normalizeTeamName";
import { useRouter } from "next/navigation";
import { entryFee, extraBracketFee, type Player } from "../data/players";

type ChatMessage = {
  id: string | number;
  name: string;
  avatarImage?: string;
  mood: "online" | "away" | "legend";
  text: string;
  timestamp: string;
};

type ChatMood = ChatMessage["mood"];

type DbChatMessage = {
  id: string;
  player_name: string;
  avatar_url?: string | null;
  message: string;
  created_at: string;
};

type PickRound = {
  round: string;
  teams: string[];
};

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
  championPick?: string;
  notes?: string;
  readablePicks?: {
    round: string;
    teams: string[];
  }[];
  rank: number;
  playerAvatar?: string;
  playerStatus: Player["status"];
};

type FinalGame = {
  id: string;
  winner: string | null;
  loser: string | null;
  completed: boolean;
};

function getPaidBrackets(player: Player) {
  return player.brackets.filter((bracket) => bracket.paid);
}

function getSubmittedBrackets(player: Player) {
  return player.brackets.filter((bracket) => bracket.submitted);
}

function getLockedPaidBrackets(player: Player) {
  return player.brackets.filter((bracket) => bracket.paid && bracket.locked);
}

function hasLiveBracket(player: Player) {
  return player.brackets.some((bracket) => bracket.championAlive);
}

function getPlayerPotContribution(player: Player) {
  const paidBracketCount = Math.min(getPaidBrackets(player).length, 4);

  if (paidBracketCount === 0) return 0;

  return entryFee + Math.max(0, paidBracketCount - 1) * extraBracketFee;
}

function getRankedBracketCards(players: Player[]): RankedBracketCard[] {
  return players
    .flatMap((player) =>
      getLockedPaidBrackets(player).map((bracket) => ({
        id: bracket.id,
        playerName: player.name,
        label: bracket.label,
        image: bracket.image,
        score: bracket.score,
        championAlive: bracket.championAlive,
        paid: bracket.paid,
        submitted: bracket.submitted,
        locked: bracket.locked,
        championPick: bracket.championPick,
        notes: bracket.notes,
        readablePicks: bracket.readablePicks,
        rank: 0,
        playerAvatar: player.avatarImage,
        playerStatus: player.status,
      }))
    )
    .sort((a, b) => b.score - a.score)
    .map((card, index) => ({
      ...card,
      rank: index + 1,
    }));
}

function getChatMoodForName(name: string): ChatMood {
  return name.trim().toLowerCase() === "grandma" ? "legend" : "online";
}

function formatChatTimestamp(createdAt: string) {
  return new Date(createdAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeAvatarPath(name: string) {
  return `/avatars/${name.trim().toLowerCase()}.png`;
}

function getActiveChatIdentity(): {
  name: string;
  avatarImage?: string;
  mood: ChatMood;
} {
  const fallback = {
    name: "Racine",
    avatarImage: "/avatars/racine.png",
    mood: "online" as ChatMood,
  };

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem("loera-session");

    if (!raw) return fallback;

    const parsed = JSON.parse(raw);

    const name = typeof parsed?.name === "string" ? parsed.name.trim() : "";
    const avatarImage =
      typeof parsed?.avatarImage === "string" ? parsed.avatarImage.trim() : "";

    if (!name) return fallback;

    return {
      name,
      avatarImage: avatarImage || normalizeAvatarPath(name),
      mood: getChatMoodForName(name),
    };
  } catch {
    return fallback;
  }
}

export default function Home() {
  const router = useRouter();
  const currentViewerName = getActiveChatIdentity().name;

  const fallbackChatMessages: ChatMessage[] = [
    {
      id: 1,
      name: "Maria",
      avatarImage: "/avatars/maria.png",
      mood: "away",
      text: "Whoever picked three upsets in round one owes the group an explanation.",
      timestamp: "10:12 PM",
    },
    {
      id: 2,
      name: "Ben",
      avatarImage: "/avatars/ben.png",
      mood: "online",
      text: "My bracket is not lucky. It is elite basketball vision.",
      timestamp: "10:14 PM",
    },
    {
      id: 3,
      name: "Hugo",
      avatarImage: "/avatars/hugo.png",
      mood: "online",
      text: "Trash talk is temporary. Cashing out is forever.",
      timestamp: "10:17 PM",
    },
    {
      id: 4,
      name: "Grandma",
      avatarImage: "/avatars/grandma.png",
      mood: "legend",
      text: "Business is business.",
      timestamp: "10:19 PM",
    },
  ];

  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [selectedBracket, setSelectedBracket] = useState<string | null>(null);
  const [breakingBracket, setBreakingBracket] =
    useState<RankedBracketCard | null>(null);
  const [showBreakingNews, setShowBreakingNews] = useState(false);
  const [finalGames, setFinalGames] = useState<FinalGame[]>([]);
  const [deathAlerts, setDeathAlerts] = useState<string[]>([]);
  const [officialResults, setOfficialResults] = useState<PickRound[]>([]);
  const previousLeaderId = useRef<string | null>(null);
  const processedBustKeys = useRef<Set<string>>(new Set());

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoaded, setChatLoaded] = useState(false);

  const paidCount = players.reduce(
    (sum, player) => sum + getPaidBrackets(player).length,
    0
  );

  const submittedCount = players.reduce(
    (sum, player) => sum + getSubmittedBrackets(player).length,
    0
  );

  const currentPot = players.reduce(
    (sum, player) => sum + getPlayerPotContribution(player),
    0
  );

  const rankedBracketCards = useMemo(
    () => getRankedBracketCards(players),
    [players]
  );

  const bracketRankMap = useMemo(
    () => Object.fromEntries(rankedBracketCards.map((card) => [card.id, card.rank])),
    [rankedBracketCards]
  );

  const allBracketCards = useMemo(
    () =>
      players.flatMap((player) =>
        player.brackets.map((bracket) => ({
          id: bracket.id,
          playerName: player.name,
          label: bracket.label,
          image: bracket.image,
          score: bracket.score,
          championAlive: bracket.championAlive,
          paid: bracket.paid,
          submitted: bracket.submitted,
          locked: bracket.locked,
          busted: bracket.busted,
          championPick: bracket.championPick,
          notes: bracket.notes,
          readablePicks: bracket.readablePicks,
          rank: bracketRankMap[bracket.id] ?? 0,
          playerAvatar: player.avatarImage,
          playerStatus: player.status,
        }))
      ),
    [players, bracketRankMap]
  );

  const leaderSpotlight = rankedBracketCards[0] ?? null;

  async function refreshPoolState() {
    try {
      const res = await fetch("/api/pool-state", {
        cache: "no-store",
      });

      const data = await res.json();

      if (Array.isArray(data.players)) {
        setPlayers((prev) => {
          const prevString = JSON.stringify(prev);
          const nextString = JSON.stringify(data.players);
          return prevString === nextString ? prev : data.players;
        });
      }

      if (Array.isArray(data.officialResults)) {
        setOfficialResults(data.officialResults);
      }
    } catch (error) {
      console.error("Failed to refresh pool state", error);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadPoolState() {
      try {
        const res = await fetch("/api/pool-state", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!active) return;

        if (Array.isArray(data.players)) {
          setPlayers((prev) => {
            const prevString = JSON.stringify(prev);
            const nextString = JSON.stringify(data.players);
            return prevString === nextString ? prev : data.players;
          });
        }

        if (Array.isArray(data.officialResults)) {
          setOfficialResults(data.officialResults);
        } else {
          setOfficialResults([]);
        }
      } catch (error) {
        console.error("Failed to load pool state", error);
      } finally {
        if (active) {
          setPlayersLoading(false);
        }
      }
    }

    void loadPoolState();

    const interval = window.setInterval(loadPoolState, 20000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadChatMessages() {
      try {
        const res = await fetch("/api/chat", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!active) return;

        if (Array.isArray(data)) {
          const mapped = data.map((message: DbChatMessage) => ({
            id: message.id,
            name: message.player_name,
            avatarImage: message.avatar_url ?? undefined,
            mood: getChatMoodForName(message.player_name),
            text: message.message,
            timestamp: formatChatTimestamp(message.created_at),
          }));

          setChatMessages((prev) => {
            const prevString = JSON.stringify(prev);
            const nextString = JSON.stringify(mapped);
            return prevString === nextString ? prev : mapped;
          });
        }
      } catch (error) {
        console.error("Failed to load chat messages", error);

        if (!active) return;

        setChatMessages((current) =>
          current.length > 0 ? current : fallbackChatMessages
        );
      } finally {
        if (active) {
          setChatLoaded(true);
        }
      }
    }

    void loadChatMessages();

    const interval = window.setInterval(loadChatMessages, 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!leaderSpotlight) return;

    if (previousLeaderId.current === null) {
      previousLeaderId.current = leaderSpotlight.id;
      return;
    }

    if (previousLeaderId.current !== leaderSpotlight.id) {
      setBreakingBracket(leaderSpotlight);
      setShowBreakingNews(true);
      previousLeaderId.current = leaderSpotlight.id;

      const timer = window.setTimeout(() => {
        setShowBreakingNews(false);
      }, 5000);

      return () => window.clearTimeout(timer);
    }
  }, [leaderSpotlight]);

  useEffect(() => {
    let active = true;

    async function loadFinalGames() {
      try {
        const response = await fetch("/api/upcoming-games", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!active) return;
        setFinalGames(Array.isArray(data.finals) ? data.finals : []);
      } catch {
        if (!active) return;
        setFinalGames([]);
      }
    }

    void loadFinalGames();

    const interval = window.setInterval(loadFinalGames, 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (finalGames.length === 0) return;

    const losingTeams = finalGames
      .filter((game) => game.completed && game.loser)
      .map((game) => game.loser)
      .filter((team): team is string => Boolean(team));

    if (losingTeams.length === 0) return;

    const newAlerts: string[] = [];

    for (const player of players) {
      for (const bracket of player.brackets) {
        if (!bracket.championPick) continue;

        const matchedLoser = losingTeams.find((loser) =>
          teamsMatch(loser, bracket.championPick)
        );

        if (!matchedLoser) continue;

        const bustKey = `${bracket.id}-${matchedLoser}`;

        if (!processedBustKeys.current.has(bustKey)) {
          processedBustKeys.current.add(bustKey);
          newAlerts.push(
            `💀 ${player.name}'s ${bracket.label} is dead — ${matchedLoser} eliminated`
          );
        }
      }
    }

    if (newAlerts.length > 0) {
      setDeathAlerts((current) => [...newAlerts, ...current].slice(0, 12));
    }
  }, [finalGames, players]);

  useEffect(() => {
    if (!selectedBracket) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedBracket(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedBracket]);

  const selectedBracketCard =
    allBracketCards.find((card) => card.id === selectedBracket) ?? null;

  const selectedBracketRank =
    selectedBracketCard && bracketRankMap[selectedBracketCard.id]
      ? bracketRankMap[selectedBracketCard.id]
      : null;

  async function submitChatMessage(
    text: string,
    overrideIdentity?: { name: string; avatarImage?: string }
  ) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const sessionIdentity = getActiveChatIdentity();
    const identity = overrideIdentity
      ? {
          name: overrideIdentity.name,
          avatarImage:
            overrideIdentity.avatarImage ||
            normalizeAvatarPath(overrideIdentity.name),
          mood: getChatMoodForName(overrideIdentity.name),
        }
      : sessionIdentity;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: identity.name,
          avatarImage: identity.avatarImage,
          text: trimmed,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error("Chat post failed:", errorData);
        throw new Error(errorData?.error || "Failed to post message");
      }

      const inserted: DbChatMessage = await res.json();

      setChatMessages((current) => [
        ...current,
        {
          id: inserted.id,
          name: inserted.player_name,
          avatarImage: inserted.avatar_url ?? undefined,
          mood: getChatMoodForName(inserted.player_name),
          text: inserted.message,
          timestamp: formatChatTimestamp(inserted.created_at),
        },
      ]);
    } catch (error) {
      console.error("Failed to post chat message", error);
    }
  }

  const addChatMessage = (text: string) => {
    void submitChatMessage(text);
  };

  const generateGrandmaBracket = async () => {
    setPlayers((current) =>
      current.map((player) => {
        if (!player.grandmaMode) return player;

        const updatedBrackets = player.brackets.map((bracket, index) =>
          index === 0
            ? {
                ...bracket,
                paid: true,
                submitted: true,
                locked: true,
                score: Math.max(bracket.score, 97),
                championAlive: true,
              }
            : bracket
        );

        return {
          ...player,
          status: "confirmed",
          paid: true,
          submitted: true,
          score: Math.max(player.score, 97),
          championAlive: true,
          aiGenerated: true,
          bracketStyle: "business-is-business",
          brackets: updatedBrackets,
        };
      })
    );

    try {
      const res = await fetch("/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_grandma",
          name: "Grandma",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to generate Grandma bracket:", data);
      }
    } catch (error) {
      console.error("Failed to generate Grandma bracket", error);
    }

    void submitChatMessage("AI made my bracket. Business is business.", {
      name: "Grandma",
      avatarImage: "/avatars/grandma.png",
    });

    await refreshPoolState();
  };

  const toggleOutStatus = async (name: string) => {
    setPlayers((current) =>
      current.map((player) => {
        if (player.name !== name) return player;

        const movingBackIn = player.status === "out";

        return {
          ...player,
          status: movingBackIn ? "maybe" : "out",
          paid: movingBackIn ? player.paid : false,
          submitted: movingBackIn ? player.submitted : false,
          championAlive: movingBackIn ? player.championAlive : false,
          brackets: player.brackets.map((bracket) =>
            movingBackIn
              ? bracket
              : {
                  ...bracket,
                  paid: false,
                  submitted: false,
                  locked: false,
                  championAlive: false,
                }
          ),
        };
      })
    );

    try {
      const res = await fetch("/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_out",
          name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to toggle out status:", data);
      }
    } catch (error) {
      console.error("Failed to toggle out status", error);
    }

    await refreshPoolState();
  };

  const toggleBusted = async (name: string) => {
    setPlayers((current) =>
      current.map((player) => {
        if (player.name !== name) return player;

        const nextChampionAlive = !hasLiveBracket(player);

        return {
          ...player,
          championAlive: nextChampionAlive,
          brackets: player.brackets.map((bracket) => ({
            ...bracket,
            championAlive: nextChampionAlive,
          })),
        };
      })
    );

    try {
      const res = await fetch("/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_busted",
          name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to toggle busted status:", data);
      }
    } catch (error) {
      console.error("Failed to toggle busted status", error);
    }

    await refreshPoolState();
  };

  if (playersLoading || !chatLoaded) {
    return (
      <LoginGate>
        <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
          <div className="text-sm tracking-wide text-white/70">
            Loading pool...
          </div>
        </main>
      </LoginGate>
    );
  }

  return (
    <LoginGate>
      <div className="min-h-screen bg-neutral-950 text-white">
        <Header
          entryFee={entryFee}
          currentPot={currentPot}
          submittedCount={submittedCount}
          paidCount={paidCount}
        />

        {showBreakingNews && breakingBracket && (
          <section className="border-b border-red-500/20 bg-gradient-to-r from-red-700 via-red-600 to-orange-500 shadow-[0_10px_40px_rgba(220,38,38,0.25)]">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
              <div className="flex items-center gap-3">
                <div className="breaking-pulse rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-red-700">
                  Breaking News
                </div>

                <div>
                  <div className="text-sm font-black uppercase tracking-[0.18em] text-red-100">
                    New leader on the board
                  </div>

                  <div className="text-lg font-black italic text-white md:text-xl">
                    #1 {breakingBracket.playerName} • {breakingBracket.label} •{" "}
                    {breakingBracket.score} pts
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedBracket(breakingBracket.id)}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Open Bracket
              </button>
            </div>
          </section>
        )}

        <UpcomingGamesStrip />
        <LiveAlertsBar players={players} deathAlerts={deathAlerts} />

        <section className="border-y border-white/10 bg-black/40 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
            <div className="rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-600/10 to-orange-500/10 p-4">
              <div className="text-[11px] font-black uppercase tracking-[0.24em] text-red-300">
                Current Leader
              </div>

              {leaderSpotlight ? (
                <>
                  <div className="mt-2 text-2xl font-black italic text-white">
                    {leaderSpotlight.playerName}
                  </div>
                  <div className="mt-1 text-sm text-neutral-300">
                    {leaderSpotlight.label}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                      #{leaderSpotlight.rank}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                      {leaderSpotlight.score} pts
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        leaderSpotlight.championAlive
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-zinc-700 text-zinc-300"
                      }`}
                    >
                      {leaderSpotlight.championAlive ? "Alive" : "Busted"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="mt-2 text-sm text-neutral-400">
                  Waiting for the first locked bracket.
                </div>
              )}
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-6 py-8 md:px-10">
          <div className="space-y-8">
            <LeaderboardHero
              rankedBracketCards={rankedBracketCards}
              onSelectBracket={setSelectedBracket}
            />

            <ChampionshipPathsAlive
              players={players}
              rankedBracketCards={rankedBracketCards}
            />

            <WinProbabilityPanel rankedBracketCards={rankedBracketCards} />

            <BracketDeathAlerts />

            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <ChatBox messages={chatMessages} onAddMessage={addChatMessage} />
              <Leaderboard players={players} />
            </div>

            <PlayerGrid
              players={players}
              bracketRankMap={bracketRankMap}
              results={officialResults}
              onSelectBracket={setSelectedBracket}
              onToggleOutStatus={toggleOutStatus}
              onToggleBusted={toggleBusted}
              onGenerateGrandmaBracket={generateGrandmaBracket}
              onEditBracket={(id) => router.push(`/bracket/${id}`)}
              currentViewerName={currentViewerName}
              isAdmin={false}
            />
          </div>
        </main>

        <BracketViewerModal
          bracket={selectedBracketCard}
          rank={selectedBracketRank}
          onClose={() => setSelectedBracket(null)}
          officialResults={officialResults}
        />

        <style jsx global>{`
          .breaking-pulse {
            animation: breakingPulse 1.6s ease-in-out infinite;
          }

          @keyframes viewerIn {
            0% {
              opacity: 0;
              transform: translateY(22px) scale(0.985);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes breakingPulse {
            0%,
            100% {
              box-shadow: 0 0 0 rgba(255, 255, 255, 0);
            }
            50% {
              box-shadow: 0 0 30px rgba(255, 255, 255, 0.18);
            }
          }
        `}</style>
      </div>
    </LoginGate>
  );
}