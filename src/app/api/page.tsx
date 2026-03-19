"use client";

import { useMemo, useState } from "react";
import BracketEditor, {
  type EditableBracket,
} from "../../components/BracketEditor";
import { initialPlayers, type Player } from "../../data/players";

type AdminChatMessage = {
  id: number;
  name: string;
  text: string;
  timestamp: string;
  flagged?: boolean;
};

function getPaidBracketCount(player: Player) {
  return player.brackets.filter((bracket) => bracket.paid).length;
}

function getSubmittedBracketCount(player: Player) {
  return player.brackets.filter((bracket) => bracket.submitted).length;
}

function getLiveBracketCount(player: Player) {
  return player.brackets.filter((bracket) => bracket.championAlive).length;
}

function getLockedBracketCount(player: Player) {
  return player.brackets.filter((bracket) => bracket.locked).length;
}

export default function AdminPage() {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [activeSection, setActiveSection] = useState<
    "players" | "brackets" | "payments" | "chat" | "overrides"
  >("players");
  const [editingBracket, setEditingBracket] = useState<{
    playerName: string;
    bracket: EditableBracket;
  } | null>(null);

  const [chatMessages, setChatMessages] = useState<AdminChatMessage[]>([
    {
      id: 1,
      name: "Maria",
      text: "Whoever picked three upsets in round one owes the group an explanation.",
      timestamp: "10:12 PM",
    },
    {
      id: 2,
      name: "Ben",
      text: "My bracket is not lucky. It is elite basketball vision.",
      timestamp: "10:14 PM",
    },
    {
      id: 3,
      name: "Hugo",
      text: "Trash talk is temporary. Cashing out is forever.",
      timestamp: "10:17 PM",
      flagged: false,
    },
  ]);

  const totals = useMemo(() => {
    const totalPlayers = players.length;
    const confirmedPlayers = players.filter(
      (player) => player.status === "confirmed"
    ).length;
    const maybePlayers = players.filter(
      (player) => player.status === "maybe"
    ).length;
    const outPlayers = players.filter((player) => player.status === "out").length;

    const totalBrackets = players.reduce(
      (sum, player) => sum + player.brackets.length,
      0
    );

    const totalPaidBrackets = players.reduce(
      (sum, player) => sum + getPaidBracketCount(player),
      0
    );

    const totalSubmittedBrackets = players.reduce(
      (sum, player) => sum + getSubmittedBracketCount(player),
      0
    );

    const totalLiveBrackets = players.reduce(
      (sum, player) => sum + getLiveBracketCount(player),
      0
    );

    const totalLockedBrackets = players.reduce(
      (sum, player) => sum + getLockedBracketCount(player),
      0
    );

    const totalScore = players.reduce((sum, player) => sum + player.score, 0);

    return {
      totalPlayers,
      confirmedPlayers,
      maybePlayers,
      outPlayers,
      totalBrackets,
      totalPaidBrackets,
      totalSubmittedBrackets,
      totalLiveBrackets,
      totalLockedBrackets,
      totalScore,
    };
  }, [players]);

  const allBrackets = useMemo(() => {
    return players.flatMap((player) =>
      player.brackets.map((bracket) => ({
        playerName: player.name,
        playerStatus: player.status,
        playerPaid: player.paid,
        playerSubmitted: player.submitted,
        bracket,
      }))
    );
  }, [players]);

  const markPlayerOut = (name: string) => {
    setPlayers((current) =>
      current.map((player) => {
        if (player.name !== name) return player;

        return {
          ...player,
          status: "out",
          championAlive: false,
          brackets: player.brackets.map((bracket) => ({
            ...bracket,
            championAlive: false,
          })),
        };
      })
    );
  };

  const markPlayerAlive = (name: string) => {
    setPlayers((current) =>
      current.map((player) => {
        if (player.name !== name) return player;

        return {
          ...player,
          status: player.status === "out" ? "maybe" : player.status,
          championAlive: true,
          brackets: player.brackets.map((bracket) => ({
            ...bracket,
            championAlive: true,
          })),
        };
      })
    );
  };

  const togglePaid = (name: string) => {
    setPlayers((current) =>
      current.map((player) => {
        if (player.name !== name) return player;

        const nextPaid = !player.paid;

        return {
          ...player,
          paid: nextPaid,
          brackets: player.brackets.map((bracket, index) =>
            index === 0
              ? {
                  ...bracket,
                  paid: nextPaid,
                }
              : bracket
          ),
        };
      })
    );
  };

  const toggleSubmitted = (name: string) => {
    setPlayers((current) =>
      current.map((player) => {
        if (player.name !== name) return player;

        const nextSubmitted = !player.submitted;

        return {
          ...player,
          submitted: nextSubmitted,
          brackets: player.brackets.map((bracket, index) =>
            index === 0
              ? {
                  ...bracket,
                  submitted: nextSubmitted,
                }
              : bracket
          ),
        };
      })
    );
  };

  const addPoints = (name: string, amount: number) => {
    setPlayers((current) =>
      current.map((player) => {
        if (player.name !== name) return player;

        return {
          ...player,
          score: Math.max(0, player.score + amount),
          brackets: player.brackets.map((bracket, index) =>
            index === 0
              ? {
                  ...bracket,
                  score: Math.max(0, bracket.score + amount),
                }
              : bracket
          ),
        };
      })
    );
  };

  const markAllBracketsBusted = () => {
    setPlayers((current) =>
      current.map((player) => ({
        ...player,
        championAlive: false,
        brackets: player.brackets.map((bracket) => ({
          ...bracket,
          championAlive: false,
        })),
      }))
    );
  };

  const markAllBracketsAlive = () => {
    setPlayers((current) =>
      current.map((player) => ({
        ...player,
        championAlive: true,
        brackets: player.brackets.map((bracket) => ({
          ...bracket,
          championAlive: true,
        })),
      }))
    );
  };

  const toggleBracketPaid = (playerName: string, bracketId: string) => {
    setPlayers((current) =>
      current.map((player) => {
        if (player.name !== playerName) return player;

        const updatedBrackets = player.brackets.map((bracket) =>
          bracket.id === bracketId
            ? {
                ...bracket,
                paid: !bracket.paid,
              }
            : bracket
        );

        return {
          ...player,
          paid: updatedBrackets.some((bracket) => bracket.paid),
          brackets: updatedBrackets,
        };
      })
    );
  };

  const toggleBracketSubmitted = (playerName: string, bracketId: string) => {
    setPlayers((current) =>
      current.map((player) => {
        if (player.name !== playerName) return player;

        const updatedBrackets = player.brackets.map((bracket) =>
          bracket.id === bracketId
            ? {
                ...bracket,
                submitted: !bracket.submitted,
              }
            : bracket
        );

        return {
          ...player,
          submitted: updatedBrackets.some((bracket) => bracket.submitted),
          brackets: updatedBrackets,
        };
      })
    );
  };

  const toggleBracketLocked = (playerName: string, bracketId: string) => {
    setPlayers((current) =>
      current.map((player) => {
        if (player.name !== playerName) return player;

        return {
          ...player,
          brackets: player.brackets.map((bracket) =>
            bracket.id === bracketId
              ? {
                  ...bracket,
                  locked: !bracket.locked,
                }
              : bracket
          ),
        };
      })
    );
  };

  const toggleBracketAlive = (playerName: string, bracketId: string) => {
    setPlayers((current) =>
      current.map((player) => {
        if (player.name !== playerName) return player;

        const updatedBrackets = player.brackets.map((bracket) =>
          bracket.id === bracketId
            ? {
                ...bracket,
                championAlive: !bracket.championAlive,
              }
            : bracket
        );

        return {
          ...player,
          championAlive: updatedBrackets.some(
            (bracket) => bracket.championAlive
          ),
          brackets: updatedBrackets,
        };
      })
    );
  };

  const addBracketPoints = (
    playerName: string,
    bracketId: string,
    amount: number
  ) => {
    setPlayers((current) =>
      current.map((player) => {
        if (player.name !== playerName) return player;

        const updatedBrackets = player.brackets.map((bracket) =>
          bracket.id === bracketId
            ? {
                ...bracket,
                score: Math.max(0, bracket.score + amount),
              }
            : bracket
        );

        return {
          ...player,
          score: updatedBrackets.reduce((sum, bracket) => sum + bracket.score, 0),
          brackets: updatedBrackets,
        };
      })
    );
  };

  const saveBracketEdits = (
    playerName: string,
    updatedBracket: EditableBracket
  ) => {
    setPlayers((current) =>
      current.map((player) => {
        if (player.name !== playerName) return player;

        const updatedBrackets = player.brackets.map((bracket) =>
          bracket.id === updatedBracket.id
            ? {
                ...bracket,
                ...updatedBracket,
              }
            : bracket
        );

        return {
          ...player,
          championAlive: updatedBrackets.some(
            (bracket) => bracket.championAlive
          ),
          brackets: updatedBrackets,
        };
      })
    );

    setEditingBracket(null);
  };

  const deleteChatMessage = (id: number) => {
    setChatMessages((current) => current.filter((message) => message.id !== id));
  };

  const toggleFlagChatMessage = (id: number) => {
    setChatMessages((current) =>
      current.map((message) =>
        message.id === id
          ? {
              ...message,
              flagged: !message.flagged,
            }
          : message
      )
    );
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-block rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-red-300">
              Private Admin Panel
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Loera March Madness Control Room
            </h1>
            <p className="mt-3 max-w-3xl text-base text-neutral-300">
              Admin-only dashboard for payments, bracket entry, uploads, chat
              moderation, and manual overrides. It still runs on local state for
              now, but the layout is ready to become your real back office.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={markAllBracketsBusted}
              className="rounded-2xl border border-red-500/25 bg-red-600/15 px-4 py-3 text-sm font-bold text-red-100 transition hover:bg-red-600/25"
            >
              Mark All Brackets Busted
            </button>

            <button
              onClick={markAllBracketsAlive}
              className="rounded-2xl border border-emerald-500/25 bg-emerald-600/15 px-4 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-600/25"
            >
              Mark All Brackets Alive
            </button>
          </div>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-neutral-400">
              Total Players
            </div>
            <div className="mt-2 text-3xl font-black">{totals.totalPlayers}</div>
            <div className="mt-2 text-sm text-neutral-400">
              {totals.confirmedPlayers} confirmed • {totals.maybePlayers} maybe •{" "}
              {totals.outPlayers} out
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-neutral-400">
              Total Brackets
            </div>
            <div className="mt-2 text-3xl font-black">{totals.totalBrackets}</div>
            <div className="mt-2 text-sm text-neutral-400">
              {totals.totalLockedBrackets} locked
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-neutral-400">
              Payments
            </div>
            <div className="mt-2 text-3xl font-black">
              {totals.totalPaidBrackets}
            </div>
            <div className="mt-2 text-sm text-neutral-400">
              paid brackets recorded
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-neutral-400">
              Submitted
            </div>
            <div className="mt-2 text-3xl font-black">
              {totals.totalSubmittedBrackets}
            </div>
            <div className="mt-2 text-sm text-neutral-400">
              brackets submitted
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-neutral-400">
              Live Paths
            </div>
            <div className="mt-2 text-3xl font-black">
              {totals.totalLiveBrackets}
            </div>
            <div className="mt-2 text-sm text-neutral-400">
              championship paths still alive
            </div>
          </div>
        </section>

        <section className="mb-8 flex flex-wrap gap-3">
          {[
            ["players", "Players"],
            ["brackets", "Brackets"],
            ["payments", "Payments"],
            ["chat", "Chat"],
            ["overrides", "Overrides"],
          ].map(([value, label]) => {
            const active = activeSection === value;
            return (
              <button
                key={value}
                onClick={() =>
                  setActiveSection(
                    value as
                      | "players"
                      | "brackets"
                      | "payments"
                      | "chat"
                      | "overrides"
                  )
                }
                className={`rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
                  active
                    ? "border-red-500/30 bg-red-600/20 text-white"
                    : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            );
          })}
        </section>

        {activeSection === "players" && (
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <div className="mb-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
                Player Controls
              </div>
              <h2 className="mt-2 text-2xl font-black italic">
                Manage the field
              </h2>
            </div>

            <div className="grid gap-4">
              {players.map((player) => (
                <div
                  key={player.name}
                  className="rounded-3xl border border-white/10 bg-neutral-900/80 p-5"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="text-2xl font-black text-white">
                        {player.name}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                          Status: {player.status}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                          Score: {player.score}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                          Paid: {player.paid ? "Yes" : "No"}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                          Submitted: {player.submitted ? "Yes" : "No"}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                          Live Brackets: {getLiveBracketCount(player)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => markPlayerOut(player.name)}
                        className="rounded-2xl border border-red-500/25 bg-red-600/15 px-3 py-2 text-sm font-bold text-red-100 transition hover:bg-red-600/25"
                      >
                        Mark RIP
                      </button>

                      <button
                        onClick={() => markPlayerAlive(player.name)}
                        className="rounded-2xl border border-emerald-500/25 bg-emerald-600/15 px-3 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-600/25"
                      >
                        Revive
                      </button>

                      <button
                        onClick={() => togglePaid(player.name)}
                        className="rounded-2xl border border-cyan-500/25 bg-cyan-600/15 px-3 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-600/25"
                      >
                        Toggle Paid
                      </button>

                      <button
                        onClick={() => toggleSubmitted(player.name)}
                        className="rounded-2xl border border-yellow-500/25 bg-yellow-600/15 px-3 py-2 text-sm font-bold text-yellow-100 transition hover:bg-yellow-600/25"
                      >
                        Toggle Submitted
                      </button>

                      <button
                        onClick={() => addPoints(player.name, 5)}
                        className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/15"
                      >
                        +5 Points
                      </button>

                      <button
                        onClick={() => addPoints(player.name, -5)}
                        className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/15"
                      >
                        -5 Points
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {player.brackets.map((bracket) => (
                      <div
                        key={bracket.id}
                        className="rounded-2xl border border-white/10 bg-black/30 p-4"
                      >
                        <div className="text-lg font-black text-white">
                          {bracket.label}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                            Score: {bracket.score}
                          </span>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                            Paid: {bracket.paid ? "Yes" : "No"}
                          </span>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                            Submitted: {bracket.submitted ? "Yes" : "No"}
                          </span>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                            Alive: {bracket.championAlive ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeSection === "brackets" && (
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <div className="mb-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
                Bracket Operations
              </div>
              <h2 className="mt-2 text-2xl font-black italic">
                Readable brackets, uploads, and controls
              </h2>
            </div>

            <div className="mb-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-neutral-300">
                  Structured Entry
                </div>
                <p className="mt-2 text-sm text-neutral-400">
                  This section is where bracket picks will eventually be entered
                  in a readable structured format instead of image-only mode.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-neutral-300">
                  Image Uploads
                </div>
                <p className="mt-2 text-sm text-neutral-400">
                  Image upload remains manual. Hook this card to Supabase Storage
                  later for scanned bracket uploads.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm font-black uppercase tracking-[0.18em] text-neutral-300">
                  Manual Overrides
                </div>
                <p className="mt-2 text-sm text-neutral-400">
                  Use bracket-level controls below only when live automation or
                  ESPN normalization needs help.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {allBrackets.map(({ playerName, playerStatus, bracket }) => (
                <div
                  key={bracket.id}
                  className="rounded-3xl border border-white/10 bg-neutral-900/80 p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="text-xl font-black text-white">
                        {bracket.label}
                      </div>
                      <div className="mt-1 text-sm text-neutral-400">
                        {playerName} • {playerStatus}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                          Score: {bracket.score}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                          Paid: {bracket.paid ? "Yes" : "No"}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                          Submitted: {bracket.submitted ? "Yes" : "No"}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                          Locked: {bracket.locked ? "Yes" : "No"}
                        </span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                          Alive: {bracket.championAlive ? "Yes" : "No"}
                        </span>
                        {bracket.championPick ? (
                          <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-300">
                            Champion Pick: {bracket.championPick}
                          </span>
                        ) : null}
                        {bracket.readablePicks &&
                        bracket.readablePicks.some(
                          (round) => round.teams.length > 0
                        ) ? (
                          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                            Readable Picks Loaded
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                            Bracket Image
                          </div>
                          <div className="mt-2 text-sm text-neutral-300">
                            {bracket.image ? "Image attached" : "No image uploaded"}
                          </div>
                          <button className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10">
                            Upload / Replace Image
                          </button>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                            Readable Entry
                          </div>
                          <div className="mt-2 text-sm text-neutral-300">
                            {bracket.readablePicks &&
                            bracket.readablePicks.some(
                              (round) => round.teams.length > 0
                            )
                              ? "Readable data available"
                              : bracket.championPick || bracket.locked
                              ? "Partial readable data available"
                              : "Bracket entry still needs structured picks"}
                          </div>
                          <button
                            onClick={() =>
                              setEditingBracket({
                                playerName,
                                bracket: {
                                  ...bracket,
                                  notes: bracket.notes ?? "",
                                  readablePicks: bracket.readablePicks ?? [],
                                },
                              })
                            }
                            className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                          >
                            Open Bracket Editor
                          </button>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                            Automation Health
                          </div>
                          <div className="mt-2 text-sm text-neutral-300">
                            This bracket is{" "}
                            {bracket.championAlive
                              ? "still in the fight"
                              : "fully busted"}
                            .
                          </div>
                          <div className="mt-3 text-xs text-neutral-500">
                            Manual overrides should stay rare.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:max-w-md xl:justify-end">
                      <button
                        onClick={() => toggleBracketPaid(playerName, bracket.id)}
                        className="rounded-2xl border border-cyan-500/25 bg-cyan-600/15 px-3 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-600/25"
                      >
                        Toggle Paid
                      </button>

                      <button
                        onClick={() =>
                          toggleBracketSubmitted(playerName, bracket.id)
                        }
                        className="rounded-2xl border border-yellow-500/25 bg-yellow-600/15 px-3 py-2 text-sm font-bold text-yellow-100 transition hover:bg-yellow-600/25"
                      >
                        Toggle Submitted
                      </button>

                      <button
                        onClick={() => toggleBracketLocked(playerName, bracket.id)}
                        className="rounded-2xl border border-purple-500/25 bg-purple-600/15 px-3 py-2 text-sm font-bold text-purple-100 transition hover:bg-purple-600/25"
                      >
                        Toggle Locked
                      </button>

                      <button
                        onClick={() => toggleBracketAlive(playerName, bracket.id)}
                        className="rounded-2xl border border-emerald-500/25 bg-emerald-600/15 px-3 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-600/25"
                      >
                        Toggle Alive
                      </button>

                      <button
                        onClick={() => addBracketPoints(playerName, bracket.id, 5)}
                        className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/15"
                      >
                        +5
                      </button>

                      <button
                        onClick={() => addBracketPoints(playerName, bracket.id, -5)}
                        className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white transition hover:bg-white/15"
                      >
                        -5
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeSection === "payments" && (
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <div className="mb-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
                Payment Tracking
              </div>
              <h2 className="mt-2 text-2xl font-black italic">
                Manual payment control
              </h2>
            </div>

            <div className="mb-5 rounded-3xl border border-white/10 bg-black/30 p-4 text-sm text-neutral-300">
              Payments stay manual by design. This section makes it easier to
              see who still owes and which bracket entries are marked paid.
            </div>

            <div className="grid gap-4">
              {players.map((player) => {
                const unpaidBrackets = player.brackets.filter(
                  (bracket) => !bracket.paid
                ).length;

                return (
                  <div
                    key={player.name}
                    className="rounded-3xl border border-white/10 bg-neutral-900/80 p-5"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <div className="text-2xl font-black">{player.name}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                            Player Paid: {player.paid ? "Yes" : "No"}
                          </span>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                            Paid Brackets: {getPaidBracketCount(player)}
                          </span>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                            Unpaid Brackets: {unpaidBrackets}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => togglePaid(player.name)}
                        className="rounded-2xl border border-cyan-500/25 bg-cyan-600/15 px-4 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-600/25"
                      >
                        Toggle Player Paid
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {player.brackets.map((bracket) => (
                        <div
                          key={bracket.id}
                          className="rounded-2xl border border-white/10 bg-black/30 p-4"
                        >
                          <div className="text-lg font-black">{bracket.label}</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                              {bracket.paid ? "Paid" : "Unpaid"}
                            </span>
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                              {bracket.submitted ? "Submitted" : "Not Submitted"}
                            </span>
                          </div>

                          <button
                            onClick={() =>
                              toggleBracketPaid(player.name, bracket.id)
                            }
                            className="mt-4 rounded-2xl border border-cyan-500/25 bg-cyan-600/15 px-3 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-600/25"
                          >
                            Toggle Bracket Paid
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeSection === "chat" && (
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <div className="mb-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
                Chat Admin
              </div>
              <h2 className="mt-2 text-2xl font-black italic">
                Moderate and preserve the pool chatter
              </h2>
            </div>

            <div className="mb-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                  Current State
                </div>
                <div className="mt-2 text-lg font-black text-white">
                  Local-only chat
                </div>
                <p className="mt-2 text-sm text-neutral-400">
                  This needs Supabase next so messages persist across refreshes
                  and can be shared by everyone live.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                  Needed Soon
                </div>
                <div className="mt-2 text-lg font-black text-white">
                  Persistent messages
                </div>
                <p className="mt-2 text-sm text-neutral-400">
                  Store name, avatar, text, timestamp, and moderation state in a
                  database table.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                  Admin Actions
                </div>
                <div className="mt-2 text-lg font-black text-white">
                  Flag / delete
                </div>
                <p className="mt-2 text-sm text-neutral-400">
                  Keep the trash talk fun without letting the thread become a pit.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-3xl border border-white/10 bg-neutral-900/80 p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="text-lg font-black text-white">
                        {message.name}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-neutral-500">
                        {message.timestamp}
                      </div>
                      <div className="mt-3 text-sm text-neutral-200">
                        {message.text}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                          Status: {message.flagged ? "Flagged" : "Clean"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleFlagChatMessage(message.id)}
                        className="rounded-2xl border border-yellow-500/25 bg-yellow-600/15 px-3 py-2 text-sm font-bold text-yellow-100 transition hover:bg-yellow-600/25"
                      >
                        {message.flagged ? "Unflag" : "Flag"}
                      </button>

                      <button
                        onClick={() => deleteChatMessage(message.id)}
                        className="rounded-2xl border border-red-500/25 bg-red-600/15 px-3 py-2 text-sm font-bold text-red-100 transition hover:bg-red-600/25"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeSection === "overrides" && (
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <div className="mb-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
                Manual Overrides
              </div>
              <h2 className="mt-2 text-2xl font-black italic">
                Emergency tools only
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <div className="text-lg font-black text-white">
                  What should stay automatic
                </div>
                <div className="mt-3 space-y-2 text-sm text-neutral-300">
                  <div>✅ Live scores</div>
                  <div>✅ Game results</div>
                  <div>✅ Bracket deaths</div>
                  <div>✅ Leaderboard updates</div>
                  <div>✅ Championship alive paths</div>
                  <div>✅ Upset alerts</div>
                  <div>✅ Pool carnage alerts</div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <div className="text-lg font-black text-white">
                  What should stay manual
                </div>
                <div className="mt-3 space-y-2 text-sm text-neutral-300">
                  <div>• Uploading bracket images</div>
                  <div>• Marking payments</div>
                  <div>• Entering readable bracket picks initially</div>
                  <div>• Admin moderation and correction when data goes weird</div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-red-500/20 bg-gradient-to-r from-red-600/10 to-orange-500/10 p-5">
              <div className="text-sm font-black uppercase tracking-[0.18em] text-red-300">
                Ground Rule
              </div>
              <p className="mt-2 max-w-3xl text-sm text-neutral-200">
                If you find yourself using these buttons often, the automation
                layer probably needs improvement instead of more admin clicking.
              </p>
            </div>
          </section>
        )}
      </div>

      {editingBracket && (
        <BracketEditor
          playerName={editingBracket.playerName}
          bracket={editingBracket.bracket}
          onSave={(updatedBracket) =>
            saveBracketEdits(editingBracket.playerName, updatedBracket)
          }
          onClose={() => setEditingBracket(null)}
        />
      )}
    </main>
  );
}