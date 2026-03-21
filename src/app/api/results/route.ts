import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizeReadablePicks, type PickRound } from "@/lib/bracketRounds";

type ResultsRow = {
  id: string;
  label: string;
  readable_results: PickRound[] | null;
  updated_at?: string | null;
};

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("tournament_results")
    .select("id, label, readable_results, updated_at")
    .eq("id", "current")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const readableResults = normalizeReadablePicks(
    Array.isArray(data?.readable_results) ? data.readable_results : []
  );

  return NextResponse.json({
    id: data?.id ?? "current",
    label: data?.label ?? "Official Results",
    readableResults,
    updatedAt: data?.updated_at ?? null,
  });
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      readableResults?: PickRound[];
      label?: string;
    };

    const readableResults = normalizeReadablePicks(body.readableResults ?? []);
    const label =
      typeof body.label === "string" && body.label.trim()
        ? body.label.trim()
        : "Official Results";

    const { data, error } = await supabaseAdmin
      .from("tournament_results")
      .upsert(
        {
          id: "current",
          label,
          readable_results: readableResults,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select("id, label, readable_results, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      label: data.label,
      readableResults: normalizeReadablePicks(
        Array.isArray(data.readable_results) ? data.readable_results : []
      ),
      updatedAt: data.updated_at ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}