"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PlayerInfo = {
  id?: string;
  name: string;
  avatar_url?: string | null;
  status?: "confirmed" | "maybe" | "out" | string | null;
  grandmaMode?: boolean;
  aiGenerated?: boolean;
  bracketStyle?: string | null;
};

type PoolPlayer = {
  id?: string;
  name: string;
  avatarImage?: string;
  status?: "confirmed" | "maybe" | "out";
  paid?: boolean;
  submitted?: boolean;
  score?: number;
  championAlive?: boolean;
  grandmaMode?: boolean;
  aiGenerated?: boolean;
  bracketStyle?: string;
  brackets?: Array<{
    id: string;
    label: string;
    paid: boolean;
    submitted: boolean;
    locked: boolean;
    score: number;
    championAlive: boolean;
  }>;
};

type Bracket = {
  id: string;
  player_id?: string;
  bracket_name?: string | null;
  label?: string | null;
  bracket_url?: string | null;
  image_url?: string | null;
  score?: number | null;
  paid?: boolean | null;
  submitted?: boolean | null;
  locked?: boolean | null;
  busted?: boolean | null;
  champion_pick?: string | null;
  champion_alive?: boolean | null;
  created_at?: string | null;
  players?: PlayerInfo | PlayerInfo[] | null;
};

function getPlayer(bracket: Bracket): PlayerInfo | null {
  if (!bracket.players) return null;
  return Array.isArray(bracket.players)
    ? bracket.players[0] ?? null
    : bracket.players;
}

function normalizeStatus(status?: string | null) {
  if (status === "confirmed" || status === "maybe" || status === "out") {
    return status;
  }
  return "maybe";
}

async function readJsonSafe(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Expected JSON but got ${contentType || "unknown"}: ${text.slice(0, 160)}`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${text.slice(0, 160)}`);
  }
}

export default function AdminPage() {
  const [brackets, setBrackets] = useState<Bracket[]>([]);
  const [players, setPlayers] = useState<PoolPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [playerActionName, setPlayerActionName] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const router = useRouter();

  async function loadBrackets() {
    const res = await fetch("/api/bracket", {
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Failed to load brackets (${res.status}): ${text.slice(0, 160)}`
      );
    }

    const data = await readJsonSafe(res);

    if (Array.isArray(data)) {
      setBrackets(data);
      return;
    }

    if (Array.isArray(data?.brackets)) {
      setBrackets(data.brackets);
      return;
    }

    setBrackets([]);
  }

  async function loadPlayers() {
    const res = await fetch("/api/pool-state", {
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Failed to load players (${res.status}): ${text.slice(0, 160)}`
      );
    }

    const data = await readJsonSafe(res);
    setPlayers(Array.isArray(data?.players) ? data.players : []);
  }

  async function loadAll() {
    try {
      setLoading(true);
      await Promise.all([loadBrackets(), loadPlayers()]);
    } catch (error) {
      console.error("Failed to load admin data", error);
      setBrackets([]);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  function updateLocalBracket(id: string, updates: Partial<Bracket>) {
    setBrackets((current) =>
      current.map((bracket) =>
        bracket.id === id ? { ...bracket, ...updates } : bracket
      )
    );
  }

  async function updateBracket(id: string, updates: Partial<Bracket>) {
    try {
      setSavingId(id);

      const res = await fetch("/api/bracket", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          ...updates,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Failed to update bracket (${res.status}): ${text.slice(0, 160)}`
        );
      }

      const data = await readJsonSafe(res);

      setBrackets((current) =>
        current.map((bracket) =>
          bracket.id === id ? { ...bracket, ...data } : bracket
        )
      );

      await loadPlayers();
    } catch (error) {
      console.error("Failed to update bracket", error);
    } finally {
      setSavingId(null);
    }
  }

  async function runPlayerAction(
    name: string,
    action: "set_status" | "toggle_busted" | "generate_grandma",
    status?: "confirmed" | "maybe" | "out"
  ) {
    try {
      setPlayerActionName(name);

      const res = await fetch("/admin/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          action,
          status,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Failed player action (${res.status}): ${text.slice(0, 160)}`
        );
      }

      await readJsonSafe(res);
      await loadAll();
    } catch (error) {
      console.error("Failed player action", error);
    } finally {
      setPlayerActionName(null);
    }
  }

  const filteredBrackets = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return brackets;

    return brackets.filter((bracket) => {
      const player = getPlayer(bracket);
      const playerName = player?.name?.toLowerCase() ?? "";
      const label = bracket.label?.toLowerCase() ?? "";
      const bracketName = bracket.bracket_name?.toLowerCase() ?? "";
      const championPick = bracket.champion_pick?.toLowerCase() ?? "";

      return (
        playerName.includes(query) ||
        label.includes(query) ||
        bracketName.includes(query) ||
        championPick.includes(query)
      );
    });
  }, [brackets, search]);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.name.localeCompare(b.name));
  }, [players]);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 p-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6">
            Loading admin panel...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
              Control Room
            </div>
            <h1 className="mt-2 text-3xl font-black italic md:text-4xl">
              Admin Bracket Dashboard
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              Update player status, payment state, bracket locks, champion picks,
              image links, and bracket health.
            </p>
          </div>

          <div className="flex gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player, bracket, or champion..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-500 md:w-80"
            />

            <button
              onClick={() => void loadAll()}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Refresh
            </button>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 shadow-2xl shadow-black/20">
          <div className="mb-5">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Player Controls
            </div>
            <h2 className="mt-2 text-2xl font-black italic text-white">
              Status / Grandma / Busted Controls
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              These are player-level controls. Use these to set someone as confirmed,
              maybe, not joining, bust all their brackets, or generate Grandma mode.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedPlayers.map((player) => {
              const status = normalizeStatus(player.status);
              const isGrandma = player.name.toLowerCase() === "grandma";
              const liveBracketCount =
                player.brackets?.filter((b) => b.championAlive).length ?? 0;
              const paidBracketCount =
                player.brackets?.filter((b) => b.paid).length ?? 0;

              return (
                <div
                  key={player.name}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-black text-white">
                        {player.name}
                      </div>
                      <div className="mt-1 text-sm text-neutral-400">
                        Status:{" "}
                        <span className="font-semibold text-white">
                          {status.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-neutral-400">
                        Paid brackets:{" "}
                        <span className="font-semibold text-white">
                          {paidBracketCount}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-neutral-400">
                        Live brackets:{" "}
                        <span className="font-semibold text-white">
                          {liveBracketCount}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                      {playerActionName === player.name ? "Working..." : "Ready"}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button
                        onClick={() =>
                          void runPlayerAction(player.name, "set_status", "confirmed")
                        }
                        className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                          status === "confirmed"
                            ? "bg-emerald-500 text-black"
                            : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                        }`}
                      >
                        Confirmed
                      </button>

                      <button
                        onClick={() =>
                          void runPlayerAction(player.name, "set_status", "maybe")
                        }
                        className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                          status === "maybe"
                            ? "bg-yellow-400 text-black"
                            : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                        }`}
                      >
                        Maybe
                      </button>

                      <button
                        onClick={() =>
                          void runPlayerAction(player.name, "set_status", "out")
                        }
                        className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                          status === "out"
                            ? "bg-red-500 text-white"
                            : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                        }`}
                      >
                        Not Joining
                      </button>
                    </div>

                    <button
                      onClick={() => void runPlayerAction(player.name, "toggle_busted")}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                    >
                      {liveBracketCount === 0
                        ? "Revive All Brackets"
                        : "Mark All Brackets Busted"}
                    </button>

                    {isGrandma && (
                      <button
                        onClick={() =>
                          void runPlayerAction(player.name, "generate_grandma")
                        }
                        className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-black text-black hover:brightness-105"
                      >
                        Generate Grandma AI Bracket
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {filteredBrackets.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 text-neutral-400">
            No brackets found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBrackets.map((bracket) => {
              const player = getPlayer(bracket);
              const isSaving = savingId === bracket.id;

              return (
                <div
                  key={bracket.id}
                  className="rounded-3xl border border-white/10 bg-neutral-900/80 p-5 shadow-2xl shadow-black/20"
                >
                  <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                        {player?.name ?? "Unknown Player"}
                      </div>

                      <div className="mt-1 text-2xl font-black text-white">
                        {bracket.label || bracket.bracket_name || "Unnamed Bracket"}
                      </div>

                      <div className="mt-1 text-sm text-neutral-500">
                        Bracket ID: {bracket.id}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => router.push(`/bracket/${bracket.id}`)}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                      >
                        Open Builder
                      </button>

                      <div
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                          isSaving
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {isSaving ? "Saving..." : "Ready"}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                          Bracket Label
                        </label>
                        <input
                          value={bracket.label ?? ""}
                          onChange={(e) =>
                            updateLocalBracket(bracket.id, {
                              label: e.target.value,
                            })
                          }
                          onBlur={() =>
                            void updateBracket(bracket.id, {
                              label: bracket.label ?? "",
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                          Champion Pick
                        </label>
                        <input
                          value={bracket.champion_pick ?? ""}
                          onChange={(e) =>
                            updateLocalBracket(bracket.id, {
                              champion_pick: e.target.value,
                            })
                          }
                          onBlur={() =>
                            void updateBracket(bracket.id, {
                              champion_pick: bracket.champion_pick ?? "",
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                          Image URL
                        </label>
                        <input
                          value={bracket.image_url ?? ""}
                          onChange={(e) =>
                            updateLocalBracket(bracket.id, {
                              image_url: e.target.value,
                            })
                          }
                          onBlur={() =>
                            void updateBracket(bracket.id, {
                              image_url: bracket.image_url ?? "",
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                          Score
                        </label>
                        <input
                          type="number"
                          value={bracket.score ?? 0}
                          onChange={(e) =>
                            updateLocalBracket(bracket.id, {
                              score: Number(e.target.value || 0),
                            })
                          }
                          onBlur={() =>
                            void updateBracket(bracket.id, {
                              score: Number(bracket.score ?? 0),
                            })
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                          <span>Paid</span>
                          <input
                            type="checkbox"
                            checked={!!bracket.paid}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateLocalBracket(bracket.id, { paid: checked });
                              void updateBracket(bracket.id, { paid: checked });
                            }}
                          />
                        </label>

                        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                          <span>Submitted</span>
                          <input
                            type="checkbox"
                            checked={!!bracket.submitted}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateLocalBracket(bracket.id, {
                                submitted: checked,
                              });
                              void updateBracket(bracket.id, {
                                submitted: checked,
                              });
                            }}
                          />
                        </label>

                        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                          <span>Locked</span>
                          <input
                            type="checkbox"
                            checked={!!bracket.locked}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateLocalBracket(bracket.id, { locked: checked });
                              void updateBracket(bracket.id, { locked: checked });
                            }}
                          />
                        </label>

                        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                          <span>Busted</span>
                          <input
                            type="checkbox"
                            checked={!!bracket.busted}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateLocalBracket(bracket.id, { busted: checked });
                              void updateBracket(bracket.id, { busted: checked });
                            }}
                          />
                        </label>

                        <label className="col-span-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
                          <span>Champion Alive</span>
                          <input
                            type="checkbox"
                            checked={!!bracket.champion_alive}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateLocalBracket(bracket.id, {
                                champion_alive: checked,
                              });
                              void updateBracket(bracket.id, {
                                champion_alive: checked,
                              });
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}