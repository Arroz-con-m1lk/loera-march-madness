"use client";

import { useEffect, useMemo, useState } from "react";

type LiveAlert = {
  id: string;
  message: string;
  type?: string;
  playerName?: string | null;
  bracketLabel?: string | null;
  score?: number | null;
  createdAt?: string | null;
};

type DeathAlert = {
  id: string;
  playerName: string;
  bracketLabel: string;
  score?: number;
  createdAt: number;
};

function parseDeathMessage(message: string) {
  const cleaned = message.replace("💀", "").trim();
  const match = cleaned.match(/^(.+?)'s (.+?) is busted$/i);

  if (!match) {
    return {
      playerName: "Unknown",
      bracketLabel: "Bracket",
    };
  }

  return {
    playerName: match[1],
    bracketLabel: match[2],
  };
}

function AlertCard({
  playerName,
  bracketLabel,
  score,
}: {
  playerName: string;
  bracketLabel: string;
  score?: number;
}) {
  return (
    <div className="rounded-2xl border border-red-500/25 bg-gradient-to-r from-red-600/15 to-orange-500/10 p-4">
      <div className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
        Bracket Death Alert
      </div>

      <div className="mt-2 text-lg font-black text-white">{playerName}</div>

      <div className="mt-1 text-sm text-white/70">
        {bracketLabel} just got clipped.
      </div>

      {typeof score === "number" && (
        <div className="mt-3 inline-flex rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white/75">
          {score} pts at time of death
        </div>
      )}
    </div>
  );
}

export default function BracketDeathAlerts() {
  const [alerts, setAlerts] = useState<DeathAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/live-alerts", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!active) return;

        const now = Date.now();

        const parsed: DeathAlert[] = ((data?.alerts ?? []) as LiveAlert[])
          .filter((alert: LiveAlert) => alert.type === "busted")
          .map((alert: LiveAlert) => {
            const parsedText = parseDeathMessage(alert.message);

            return {
              id: alert.id,
              playerName: alert.playerName ?? parsedText.playerName,
              bracketLabel: alert.bracketLabel ?? parsedText.bracketLabel,
              score: typeof alert.score === "number" ? alert.score : undefined,
              createdAt: alert.createdAt
                ? new Date(alert.createdAt).getTime()
                : now,
            };
          })
          .filter((alert: DeathAlert) => now - alert.createdAt <= 3 * 60 * 60 * 1000)
          .sort((a: DeathAlert, b: DeathAlert) => b.createdAt - a.createdAt);

        setAlerts(parsed);
      } catch (err) {
        console.error("Failed to load death alerts", err);
        setAlerts([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    const interval = window.setInterval(load, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const visibleAlerts = useMemo(() => alerts.slice(0, 4), [alerts]);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.28em] text-red-300">
            Who Just Lost Their Bracket?
          </div>

          <h2 className="mt-1 text-2xl font-black italic text-white">
            Bracket Death Alerts
          </h2>

          <p className="mt-1 text-sm text-white/55">
            Broadcast-style alerts driven by official results.
          </p>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
          {alerts.length} recent busted brackets
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-white/50">Loading alerts...</div>
      ) : visibleAlerts.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              playerName={alert.playerName}
              bracketLabel={alert.bracketLabel}
              score={alert.score}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/55">
          No bracket deaths in the last few hours.
        </div>
      )}
    </section>
  );
}