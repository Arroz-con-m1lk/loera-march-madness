import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type PlayerActionBody = {
  action?: "set_status" | "toggle_busted" | "generate_grandma";
  name?: string;
  status?: "confirmed" | "maybe" | "out";
};

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as PlayerActionBody;
    const action = body?.action;
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!action || !name) {
      return NextResponse.json(
        { error: "Action and player name are required." },
        { status: 400 }
      );
    }

    const { data: player, error: playerError } = await supabaseAdmin
      .from("players")
      .select("id, name, status, grandma_mode, ai_generated, bracket_style")
      .ilike("name", name)
      .maybeSingle();

    if (playerError) {
      return NextResponse.json(
        { error: playerError.message },
        { status: 500 }
      );
    }

    if (!player) {
      return NextResponse.json(
        { error: "Player not found." },
        { status: 404 }
      );
    }

    if (action === "set_status") {
      const nextStatus = body.status;

      if (
        nextStatus !== "confirmed" &&
        nextStatus !== "maybe" &&
        nextStatus !== "out"
      ) {
        return NextResponse.json(
          { error: "Valid status is required." },
          { status: 400 }
        );
      }

      const { error: updatePlayerError } = await supabaseAdmin
        .from("players")
        .update({ status: nextStatus })
        .eq("id", player.id);

      if (updatePlayerError) {
        return NextResponse.json(
          { error: updatePlayerError.message },
          { status: 500 }
        );
      }

      if (nextStatus === "out") {
        const { error: updateBracketsError } = await supabaseAdmin
          .from("brackets")
          .update({
            paid: false,
            submitted: false,
            locked: false,
            champion_alive: false,
            busted: true,
          })
          .eq("player_id", player.id);

        if (updateBracketsError) {
          return NextResponse.json(
            { error: updateBracketsError.message },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        ok: true,
        action,
        name,
        status: nextStatus,
      });
    }

    if (action === "toggle_busted") {
      const { data: brackets, error: bracketsError } = await supabaseAdmin
        .from("brackets")
        .select("id, champion_alive")
        .eq("player_id", player.id);

      if (bracketsError) {
        return NextResponse.json(
          { error: bracketsError.message },
          { status: 500 }
        );
      }

      if (!brackets || brackets.length === 0) {
        return NextResponse.json(
          { error: "Player has no brackets." },
          { status: 400 }
        );
      }

      const hasLiveBracket = brackets.some((b) => b.champion_alive);
      const nextChampionAlive = !hasLiveBracket;

      const { error: updateBracketsError } = await supabaseAdmin
        .from("brackets")
        .update({
          champion_alive: nextChampionAlive,
          busted: !nextChampionAlive,
        })
        .eq("player_id", player.id);

      if (updateBracketsError) {
        return NextResponse.json(
          { error: updateBracketsError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        action,
        name,
        champion_alive: nextChampionAlive,
      });
    }

    if (action === "generate_grandma") {
      const { data: brackets, error: bracketsError } = await supabaseAdmin
        .from("brackets")
        .select("id, score")
        .eq("player_id", player.id)
        .order("created_at", { ascending: true });

      if (bracketsError) {
        return NextResponse.json(
          { error: bracketsError.message },
          { status: 500 }
        );
      }

      const firstBracket = brackets?.[0];

      if (!firstBracket) {
        return NextResponse.json(
          { error: "Grandma has no bracket to generate." },
          { status: 400 }
        );
      }

      const { error: updatePlayerError } = await supabaseAdmin
        .from("players")
        .update({
          status: "confirmed",
          ai_generated: true,
          bracket_style: "business-is-business",
        })
        .eq("id", player.id);

      if (updatePlayerError) {
        return NextResponse.json(
          { error: updatePlayerError.message },
          { status: 500 }
        );
      }

      const { error: updateFirstBracketError } = await supabaseAdmin
        .from("brackets")
        .update({
          paid: true,
          submitted: true,
          locked: true,
          score: Math.max(firstBracket.score ?? 0, 97),
          champion_alive: true,
          busted: false,
        })
        .eq("id", firstBracket.id);

      if (updateFirstBracketError) {
        return NextResponse.json(
          { error: updateFirstBracketError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        action,
        name,
        ai_generated: true,
        bracket_style: "business-is-business",
      });
    }

    return NextResponse.json(
      { error: "Invalid action." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}