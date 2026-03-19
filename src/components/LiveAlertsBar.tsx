"use client";

import { useMemo, useState } from "react";

type PlayerLite = {
  name: string;
  status?: "confirmed" | "maybe" | "out";
  brackets: {
    id: string;
    label: string;
    championAlive: boolean;
    paid: boolean;
    locked: boolean;
  }[];
};

type UpsetAlert = {
  id: string;
  seedWinner: number;
  seedLoser: number;
  bustedPercent: number;
  teamWinner: string;
};

type AlertItem =
  | {
      id: string;
      type: "death";
      text: string;
    }
  | {
      id: string;
      type: "upset";
      text: string;
    }
  | {
      id: string;
      type: "system";
      text: string;
    };

type LiveAlertsBarProps = {
  players: PlayerLite[];
  deathAlerts?: string[];
};

export default function LiveAlertsBar({
  players,
  deathAlerts = [],
}: LiveAlertsBarProps) {
  const [upsetAlerts] = useState<UpsetAlert[]>([
    {
      id: "upset-1",
      seedWinner: 12,
      seedLoser: 5,
      bustedPercent: 64,
      teamWinner: "McNeese",
    },
    {
      id: "upset-2",
      seedWinner: 11,
      seedLoser: 6,
      bustedPercent: 41,
      teamWinner: "Drake",
    },
  ]);

  const incomingDeathAlertItems = useMemo(
    () =>
      deathAlerts.map((text, index) => ({
        id: `incoming-death-${index}`,
        type: "death" as const,
        text,
      })),
    [deathAlerts]
  );

  const genericDeathAlerts = useMemo(() => {
    return players.flatMap((player) =>
      player.brackets
        .filter(
          (bracket) =>
            bracket.paid && bracket.locked && bracket.championAlive === false
        )
        .map((bracket) => ({
          id: `death-${player.name}-${bracket.id}`,
          type: "death" as const,
          text: `💀 ${player.name}'s ${bracket.label} bracket is dead`,
        }))
    );
  }, [players]);

  const filteredGenericDeathAlerts = useMemo(() => {
    if (incomingDeathAlertItems.length === 0) return genericDeathAlerts;

    return genericDeathAlerts.filter(
      (genericAlert) =>
        !incomingDeathAlertItems.some((incomingAlert) =>
          incomingAlert.text.includes(genericAlert.text.replace(" is dead", ""))
        )
    );
  }, [genericDeathAlerts, incomingDeathAlertItems]);

  const upsetAlertItems = useMemo(
    () =>
      upsetAlerts.map((alert) => ({
        id: alert.id,
        type: "upset" as const,
        text: `🚨 ${alert.seedWinner} seed ${alert.teamWinner} over ${alert.seedLoser} seed — ${alert.bustedPercent}% of brackets busted`,
      })),
    [upsetAlerts]
  );

  const allAlerts: AlertItem[] = useMemo(() => {
    const merged = [
      ...incomingDeathAlertItems,
      ...filteredGenericDeathAlerts,
      ...upsetAlertItems,
    ];

    if (merged.length === 0) {
      return [
        {
          id: "system-waiting",
          type: "system",
          text: "🏀 Live alerts armed. Waiting for bracket chaos.",
        },
        {
          id: "system-waiting-duplicate",
          type: "system",
          text: "🏀 Live alerts armed. Waiting for bracket chaos.",
        },
      ];
    }

    return [...merged, ...merged];
  }, [incomingDeathAlertItems, filteredGenericDeathAlerts, upsetAlertItems]);

  return (
    <section className="border-y border-white/10 bg-neutral-950">
      <div className="border-b border-white/10 bg-gradient-to-r from-red-800/85 via-red-700/75 to-orange-600/75 px-4 py-2.5 text-center text-[11px] font-black uppercase tracking-[0.28em] text-white">
        Live Alerts
      </div>

      <div className="relative overflow-hidden">
        <div className="alerts-track flex min-w-max items-center gap-3 px-5 py-3">
          {allAlerts.map((alert, index) => (
            <div
              key={`${alert.id}-${index}`}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
                alert.type === "death"
                  ? "border-zinc-700 bg-zinc-900 text-zinc-200"
                  : alert.type === "upset"
                  ? "border-red-500/15 bg-red-900/35 text-red-50"
                  : "border-white/10 bg-white/5 text-neutral-200"
              }`}
            >
              {alert.text}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .alerts-track {
          animation: alertsScroll 38s linear infinite;
        }

        .alerts-track:hover {
          animation-play-state: paused;
        }

        @keyframes alertsScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}