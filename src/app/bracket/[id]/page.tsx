"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BracketBuilder from "../../../components/BracketBuilder";
import {
  PickRound,
  normalizeReadablePicks,
  getChampionPickFromRounds,
  getTotalEnteredTeams,
} from "../../../lib/bracketRounds";
import { FIRST_ROUND_MATCHUPS } from "../../../lib/bracket-data";

type BracketResponse = {
  id: string;
  label: string;
  playerName: string;
  image?: string;
  paid: boolean;
  submitted: boolean;
  locked: boolean;
  score: number;
  championAlive: boolean;
  championPick?: string | null;
  readablePicks?: PickRound[];
};

type ApiError = {
  error?: string;
};

function getApiErrorMessage(
  data: BracketResponse | ApiError,
  fallback: string
) {
  return "error" in data && typeof data.error === "string"
    ? data.error
    : fallback;
}

export default function BracketPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const bracketId = typeof params?.id === "string" ? params.id : "";

  const [bracket, setBracket] = useState<BracketResponse | null>(null);
  const [rounds, setRounds] = useState<PickRound[]>(normalizeReadablePicks([]));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBracket() {
      if (!bracketId) return;

      try {
        setLoading(true);
        setError("");
        setStatusMessage("");

        const res = await fetch(`/api/bracket/${bracketId}`, {
          cache: "no-store",
        });

        const data = (await res.json()) as BracketResponse | ApiError;

        if (!active) return;

        if (!res.ok) {
          setError(getApiErrorMessage(data, "Failed to load bracket."));
          setBracket(null);
          return;
        }

        const loadedBracket = data as BracketResponse;
        setBracket(loadedBracket);
        setRounds(normalizeReadablePicks(loadedBracket.readablePicks));
      } catch {
        if (!active) return;
        setError("Failed to load bracket.");
        setBracket(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadBracket();

    return () => {
      active = false;
    };
  }, [bracketId]);

  const championPick = useMemo(() => getChampionPickFromRounds(rounds), [rounds]);
  const totalEnteredTeams = useMemo(() => getTotalEnteredTeams(rounds), [rounds]);
  const isLocked = !!bracket?.locked;
  const canEdit = !!bracket && !isLocked;

  async function saveBracket() {
    if (!bracket || isLocked) return;

    try {
      setSaving(true);
      setError("");
      setStatusMessage("");

      const res = await fetch(`/api/bracket/${bracket.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          readablePicks: rounds,
          championPick,
        }),
      });

      const data = (await res.json()) as BracketResponse | ApiError;

      if (!res.ok) {
        setError(getApiErrorMessage(data, "Failed to save bracket."));
        return;
      }

      const updated = data as BracketResponse;
      setBracket(updated);
      setRounds(normalizeReadablePicks(updated.readablePicks));
      setStatusMessage("Bracket saved.");
    } catch {
      setError("Failed to save bracket.");
    } finally {
      setSaving(false);
    }
  }

  async function submitBracket() {
    if (!bracket || isLocked) return;

    const confirmed = window.confirm(
      "Submit this bracket? After submission it will be locked and cannot be edited."
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);
      setError("");
      setStatusMessage("");

      const saveRes = await fetch(`/api/bracket/${bracket.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          readablePicks: rounds,
          championPick,
        }),
      });

      const saveData = (await saveRes.json()) as BracketResponse | ApiError;

      if (!saveRes.ok) {
        setError(
          getApiErrorMessage(saveData, "Failed to save bracket before submit.")
        );
        return;
      }

      const res = await fetch(`/api/bracket/${bracket.id}/submit`, {
        method: "POST",
      });

      const data = (await res.json()) as BracketResponse | ApiError;

      if (!res.ok) {
        setError(getApiErrorMessage(data, "Failed to submit bracket."));
        return;
      }

      const submittedBracket = data as BracketResponse;
      setBracket(submittedBracket);
      setRounds(normalizeReadablePicks(submittedBracket.readablePicks));
      setStatusMessage("Bracket submitted and locked.");
    } catch {
      setError("Failed to submit bracket.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white md:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-neutral-900/80 p-6">
          Loading bracket...
        </div>
      </main>
    );
  }

  if (!bracket) {
    return (
      <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white md:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-neutral-900/80 p-6">
          <div className="text-xl font-bold">Bracket not found</div>
          <div className="mt-2 text-sm text-neutral-400">
            {error || "We could not load that bracket."}
          </div>
          <button
            onClick={() => router.push("/")}
            className="mt-5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            Back Home
          </button>
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
              <div className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
                Bracket Builder
              </div>
              <h1 className="mt-2 text-3xl font-black italic md:text-4xl">
                {bracket.label}
              </h1>
              <div className="mt-2 text-sm text-neutral-400">
                Owner:{" "}
                <span className="font-semibold text-white">
                  {bracket.playerName}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  bracket.paid
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-yellow-500/20 text-yellow-300"
                }`}
              >
                {bracket.paid ? "Paid" : "Not Paid"}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  bracket.submitted
                    ? "bg-purple-500/20 text-purple-300"
                    : "bg-zinc-700 text-zinc-300"
                }`}
              >
                {bracket.submitted ? "Submitted" : "Draft"}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  bracket.locked
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-zinc-700 text-zinc-300"
                }`}
              >
                {bracket.locked ? "Locked" : "Editable"}
              </span>

              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                Score: {bracket.score}
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Champion Pick
              </div>
              <div className="mt-2 text-2xl font-black text-white">
                {championPick || "No champion selected yet"}
              </div>
              <div className="mt-2 text-sm text-neutral-400">
                The championship winner is derived from your final round entry.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                Actions
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={saveBracket}
                  disabled={!canEdit || saving || submitting}
                  className={`rounded-xl px-4 py-3 text-sm font-black uppercase tracking-[0.08em] ${
                    !canEdit || saving || submitting
                      ? "cursor-not-allowed bg-white/10 text-white/40"
                      : "bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-900/30"
                  }`}
                >
                  {saving ? "Saving..." : "Save Bracket"}
                </button>

                <button
                  onClick={submitBracket}
                  disabled={!canEdit || saving || submitting}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                    !canEdit || saving || submitting
                      ? "cursor-not-allowed border-white/10 bg-white/5 text-white/40"
                      : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {submitting ? "Submitting..." : "Submit Bracket"}
                </button>

                <button
                  onClick={() => router.push("/")}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Back Home
                </button>
              </div>

              {statusMessage ? (
                <div className="mt-3 text-sm text-emerald-300">{statusMessage}</div>
              ) : null}

              {error ? (
                <div className="mt-3 text-sm text-red-300">{error}</div>
              ) : null}

              {isLocked ? (
                <div className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">
                  This bracket is locked and cannot be edited.
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              Progress
            </div>
            <div className="mt-2 text-lg font-bold text-white">
              {totalEnteredTeams} picks entered
            </div>
            <div className="mt-1 text-sm text-neutral-400">
              Fill in each round, save as you go, then submit when you are ready.
            </div>
          </div>
        </section>

        <BracketBuilder
          rounds={rounds}
          canEdit={canEdit}
          onChangeRounds={setRounds}
          firstRoundMatchups={FIRST_ROUND_MATCHUPS}
        />
      </div>
    </main>
  );
}