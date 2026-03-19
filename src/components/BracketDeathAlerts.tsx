"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type BracketLite = {
  id: string;
  label: string;
  score: number;
  championAlive: boolean;
  paid: boolean;
  locked: boolean;
};

type PlayerLite = {
  name: string;
  brackets: BracketLite[];
};

type DeathAlert = {
  id: string;
  playerName: string;
  bracketLabel: string;
  score: number;
  timestamp: number;
};

type BracketDeathAlertsProps = {
  players: PlayerLite[];
};

function AlertCard({
  playerName,
  bracketLabel,
  score,
  recent = false,
}: {
  playerName: string;
  bracketLabel: string;
  score: number;
  recent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        recent
          ? "border-red-500/25 bg-gradient-to-r from-red-600/15 to-orange-500/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
        Bracket Death Alert
      </div>
      <div className="mt-2 text-lg font-black text-white">{playerName}</div>
      <div className="mt-1 text-sm text-white/70">
        {bracketLabel} just got clipped.
      </div>
      <div className="mt-3 rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white/75 inline-flex">
        {score} pts at time of death
      </div>
    </div>
  );
}

export default function BracketDeathAlerts({
  players,
}: BracketDeathAlertsProps) {
  const previousAliveMap = useRef<Record<string, boolean>>({});
  const [recentAlerts, setRecentAlerts] = useState<DeathAlert[]>([]);

  const currentBustedBrackets = useMemo(() => {
    return players.flatMap((player) =>
      player.brackets
        .filter((bracket) => bracket.paid && bracket.locked && !bracket.championAlive)
        .map((bracket) => ({
          id: bracket.id,
          playerName: player.name,
          bracketLabel: bracket.label,
          score: bracket.score,
        }))
    );
  }, [players]);

  useEffect(() => {
    const nextAliveMap: Record<string, boolean> = {};
    const newlyDead: DeathAlert[] = [];

    players.forEach((player) => {
      player.brackets.forEach((bracket) => {
        const shouldTrack = bracket.paid && bracket.locked;
        if (!shouldTrack) return;

        const wasAlive = previousAliveMap.current[bracket.id];
        const isAlive = bracket.championAlive;

        nextAliveMap[bracket.id] = isAlive;

        if (wasAlive === true && isAlive === false) {
          newlyDead.push({
            id: bracket.id,
            playerName: player.name,
            bracketLabel: bracket.label,
            score: bracket.score,
            timestamp: Date.now(),
          });
        }
      });
    });

    previousAliveMap.current = {
      ...previousAliveMap.current,
      ...nextAliveMap,
    };

    if (newlyDead.length > 0) {
      setRecentAlerts((current) => [...newlyDead, ...current].slice(0, 8));
    }
  }, [players]);

  const graveyardPreview = currentBustedBrackets.slice(0, 4);

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
            Broadcast-style alerts for brackets that just got cooked.
          </p>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
          {currentBustedBrackets.length} busted locked brackets
        </div>
      </div>

      {recentAlerts.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {recentAlerts.slice(0, 4).map((alert) => (
            <AlertCard
              key={`${alert.id}-${alert.timestamp}`}
              playerName={alert.playerName}
              bracketLabel={alert.bracketLabel}
              score={alert.score}
              recent
            />
          ))}
        </div>
      ) : graveyardPreview.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {graveyardPreview.map((alert) => (
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
          No bracket deaths to report yet. Everybody still thinks they know ball.
        </div>
      )}
    </section>
  );
}