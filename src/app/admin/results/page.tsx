"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BracketBuilder from "../../../components/BracketBuilder";
import {
  PickRound,
  normalizeReadablePicks,
  getChampionPickFromRounds,
  getTotalEnteredTeams,
} from "../../../lib/bracketRounds";
import { FIRST_ROUND_MATCHUPS } from "../../../lib/bracket-data";

type ResultsResponse = {
  id: string;
  label: string;
  readableResults?: PickRound[];
  updatedAt?: string | null;
};

type ApiError = {
  error?: string;
};

function getApiErrorMessage(
  data: ResultsResponse | ApiError,
  fallback: string
) {
  return "error" in data && typeof data.error === "string"
    ? data.error
    : fallback;
}

export default function AdminResultsPage() {
  const router = useRouter();
  const [label, setLabel] = useState("Official Results");
  const [rounds, setRounds] = useState<PickRound[]>(normalizeReadablePicks([]));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadResults() {
      try {
        setLoading(true);
        setError("");
        setStatusMessage("");

        const res = await fetch("/api/results", {
          cache: "no-store",
        });

        const data = (await res.json()) as ResultsResponse | ApiError;

        if (!active) return;

        if (!res.ok) {
          setError(getApiErrorMessage(data, "Failed to load official results."));
          return;
        }

        const results = data as ResultsResponse;
        setLabel(results.label || "Official Results");
        setRounds(normalizeReadablePicks(results.readableResults));
      } catch {
        if (!active) return;
        setError("Failed to load official results.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadResults();

    return () => {
      active = false;
    };
  }, []);

  const championPick = useMemo(() => getChampionPickFromRounds(rounds), [rounds]);
  const totalEnteredTeams = useMemo(() => getTotalEnteredTeams(rounds), [rounds]);

  async function saveResults() {
    try {
      setSaving(true);
      setError("");
      setStatusMessage("");

      const res = await fetch("/api/results", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label,
          readableResults: rounds,
        }),
      });

      const data = (await res.json()) as ResultsResponse | ApiError;

      if (!res.ok) {
        setError(getApiErrorMessage(data, "Failed to save official results."));
        return;
      }

      const updated = data as ResultsResponse;
      setLabel(updated.label || "Official Results");
      setRounds(normalizeReadablePicks(updated.readableResults));
      setStatusMessage("Official results saved. Scores will update from these winners.");
    } catch {
      setError("Failed to save official results.");
    } finally {
      setSaving(false);
    }
  }

  async function resetResults() {
    const confirmed = window.confirm(
      "Reset all official results? This will clear the scoring overlay."
    );

    if (!confirmed) return;

    setRounds(normalizeReadablePicks([]));
    setStatusMessage("Results cleared locally. Click Save Results to apply.");
    setError("");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white md:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-neutral-900/80 p-6">
          Loading official results...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                Admin Scoring Overlay
              </div>
              <h1 className="mt-2 text-3xl font-black italic md:text-4xl">
                Official Results
              </h1>
              <div className="mt-2 text-sm text-neutral-400">
                Set actual winners here. Locked user brackets stay untouched.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                Winner overlay active
              </span>

              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                Champion: {championPick || "None yet"}
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <label className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Label
              </label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
              />
              <div className="mt-3 text-sm text-neutral-400">
                Use this to represent the official tournament results that power scoring.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Actions
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={saveResults}
                  disabled={saving}
                  className={`rounded-xl px-4 py-3 text-sm font-black uppercase tracking-[0.08em] ${
                    saving
                      ? "cursor-not-allowed bg-white/10 text-white/40"
                      : "bg-gradient-to-r from-cyan-600 to-blue-500 text-white shadow-lg"
                  }`}
                >
                  {saving ? "Saving..." : "Save Results"}
                </button>

                <button
                  onClick={resetResults}
                  disabled={saving}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Clear Results
                </button>

                <button
                  onClick={() => router.push("/admin")}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Back to Admin
                </button>
              </div>

              {statusMessage ? (
                <div className="mt-3 text-sm text-emerald-300">{statusMessage}</div>
              ) : null}

              {error ? (
                <div className="mt-3 text-sm text-red-300">{error}</div>
              ) : null}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              Progress
            </div>
            <div className="mt-2 text-lg font-bold text-white">
              {totalEnteredTeams} official winners entered
            </div>
            <div className="mt-1 text-sm text-neutral-400">
              Enter actual winners round by round. Your leaderboard can score against this.
            </div>
          </div>
        </section>

        <BracketBuilder
          rounds={rounds}
          canEdit={true}
          onChangeRounds={setRounds}
          firstRoundMatchups={FIRST_ROUND_MATCHUPS}
        />
      </div>
    </main>
  );
}