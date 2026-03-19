"use client";

import { useEffect, useState } from "react";

type Session = {
  name: string;
  avatarImage: string;
};

type LoginGateProps = {
  children: React.ReactNode;
};

const STORAGE_KEY = "loera-session";

export default function LoginGate({ children }: LoginGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (
          parsed &&
          typeof parsed.name === "string" &&
          typeof parsed.avatarImage === "string"
        ) {
          setSession(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setReady(true);
    }
  }, []);

  const handleLogin = async () => {
    setError("");

    if (!name.trim() || pin.length !== 4) {
      setError("Enter your first name and 4 digit PIN");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), pin }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Invalid name or PIN");
        return;
      }

      const newSession: Session = {
        name: data.name,
        avatarImage: data.avatarImage,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);
      setName("");
      setPin("");
    } catch {
      setError("Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setName("");
    setPin("");
    setError("");
    window.location.href = "/";
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="rounded-2xl border border-white/10 bg-neutral-900 px-6 py-4">
          Loading...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-8 shadow-xl">
          <h1 className="mb-2 text-center text-3xl font-bold">
            Loera March Madness
          </h1>

          <p className="mb-6 text-center text-neutral-400">
            Enter your name and pool PIN
          </p>

          <div className="space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 outline-none"
            />

            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              maxLength={4}
              placeholder="4 digit PIN"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 outline-none"
            />

            {error && <div className="text-sm text-red-400">{error}</div>}

            <button
              onClick={handleLogin}
              className="w-full rounded-lg bg-cyan-400 py-3 font-bold text-black hover:scale-[1.02]"
            >
              Enter Pool
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-50 flex justify-end bg-neutral-950 px-4 py-3">
        <button
          onClick={handleLogout}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
        >
          Log Out
        </button>
      </div>
      {children}
    </>
  );
}