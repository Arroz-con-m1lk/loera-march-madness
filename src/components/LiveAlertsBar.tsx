"use client";

import { useEffect, useMemo, useState } from "react";

type AlertType = "death" | "upset" | "system" | "leader_change" | "top3_entry" | "one_left" | "busted" | "general";

type LiveAlertApiItem = {
  id: string;
  message: string;
  type?: string;
  entityKey?: string | null;
  createdAt?: string | null;
  expiresAt?: string | null;
};

type AlertItem = {
  id: string;
  type: AlertType;
  text: string;
};

type LiveAlertsBarProps = {
  players: {
    name: string;
    status?: "confirmed" | "maybe" | "out";
    brackets: {
      id: string;
      label: string;
      championAlive: boolean;
      paid: boolean;
      locked: boolean;
      busted?: boolean;
    }[];
  }[];
  deathAlerts?: string[];
};

function normalizeAlertType(value?: string): AlertType {
  switch (value) {
    case "death":
    case "upset":
    case "system":
    case "leader_change":
    case "top3_entry":
    case "one_left":
    case "busted":
      return value;
    default:
      return "general";
  }
}

function getAlertClasses(type: AlertType) {
  switch (type) {
    case "leader_change":
      return "border-yellow-500/20 bg-yellow-500/15 text-yellow-100";
    case "top3_entry":
      return "border-orange-500/20 bg-orange-500/15 text-orange-100";
    case "one_left":
      return "border-amber-500/20 bg-amber-500/15 text-amber-100";
    case "busted":
    case "death":
      return "border-zinc-700 bg-zinc-900 text-zinc-200";
    case "upset":
      return "border-red-500/15 bg-red-900/35 text-red-50";
    case "system":
      return "border-white/10 bg-white/5 text-neutral-200";
    default:
      return "border-cyan-500/15 bg-cyan-900/20 text-cyan-50";
  }
}

export default function LiveAlertsBar({
  players,
  deathAlerts = [],
}: LiveAlertsBarProps) {
  const [dbAlerts, setDbAlerts] = useState<AlertItem[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAlerts() {
      try {
        const res = await fetch("/api/live-alerts", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!active) return;

        const mapped: AlertItem[] = Array.isArray(data?.alerts)
          ? (data.alerts as LiveAlertApiItem[]).map((alert) => ({
              id: alert.id,
              type: normalizeAlertType(alert.type),
              text: alert.message,
            }))
          : [];

        setDbAlerts(mapped);
      } catch (error) {
        console.error("Failed to load live alerts", error);
        if (!active) return;
        setDbAlerts([]);
      } finally {
        if (active) {
          setLoadingAlerts(false);
        }
      }
    }

    void loadAlerts();

    const interval = window.setInterval(loadAlerts, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const fallbackDeathAlerts = useMemo(() => {
    return players.flatMap((player) =>
      player.brackets
        .filter((bracket) => bracket.paid && bracket.locked && bracket.busted)
        .map((bracket) => ({
          id: `fallback-busted-${player.name}-${bracket.id}`,
          type: "busted" as const,
          text: `💀 ${player.name}'s ${bracket.label} is busted`,
        }))
    );
  }, [players]);

  const incomingDeathAlertItems = useMemo(
    () =>
      deathAlerts.map((text, index) => ({
        id: `incoming-death-${index}`,
        type: "death" as const,
        text,
      })),
    [deathAlerts]
  );

  const mergedAlerts = useMemo(() => {
    const seenTexts = new Set<string>();
    const ordered = [
      ...dbAlerts,
      ...incomingDeathAlertItems,
      ...fallbackDeathAlerts,
    ];

    const deduped = ordered.filter((alert) => {
      const key = alert.text.trim().toLowerCase();
      if (seenTexts.has(key)) return false;
      seenTexts.add(key);
      return true;
    });

    if (deduped.length === 0 && !loadingAlerts) {
      return [
        {
          id: "system-waiting",
          type: "system" as const,
          text: "🏀 Live alerts armed. Waiting for bracket chaos.",
        },
      ];
    }

    return deduped;
  }, [dbAlerts, incomingDeathAlertItems, fallbackDeathAlerts, loadingAlerts]);

  const scrollingAlerts = useMemo(() => {
    if (mergedAlerts.length === 0) return [];
    return [...mergedAlerts, ...mergedAlerts];
  }, [mergedAlerts]);

  return (
    <section className="border-y border-white/10 bg-neutral-950">
      <div className="border-b border-white/10 bg-gradient-to-r from-red-800/85 via-red-700/75 to-orange-600/75 px-4 py-2.5 text-center text-[11px] font-black uppercase tracking-[0.28em] text-white">
        Live Alerts
      </div>

      <div className="relative overflow-hidden">
        <div className="alerts-track flex min-w-max items-center gap-3 px-5 py-3">
          {scrollingAlerts.map((alert, index) => (
            <div
              key={`${alert.id}-${index}`}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${getAlertClasses(
                alert.type
              )}`}
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