import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const pin = typeof body?.pin === "string" ? body.pin.trim() : "";

    if (!name || !pin) {
      return NextResponse.json(
        { error: "Name and PIN are required." },
        { status: 400 }
      );
    }

    const { data: player, error } = await supabaseAdmin
      .from("players")
      .select("id, name, pin, avatar_url")
      .ilike("name", name)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!player) {
      return NextResponse.json(
        { error: "Invalid name or PIN." },
        { status: 401 }
      );
    }

    if ((player.pin ?? "").trim() !== pin) {
      return NextResponse.json(
        { error: "Invalid name or PIN." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      id: player.id,
      name: player.name,
      avatarImage:
        player.avatar_url || `/avatars/${player.name.toLowerCase()}.png`,
    });

    response.cookies.set("loera_player_name", player.name, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });

    response.cookies.set("loera_player_id", player.id, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}