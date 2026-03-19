import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ChatRequestBody = {
  name?: string;
  avatarImage?: string;
  text?: string;
};

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .select("id, player_name, avatar_url, message, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json((data ?? []).reverse());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;

    const name =
      typeof body?.name === "string" ? body.name.trim() : "";
    const avatarImage =
      typeof body?.avatarImage === "string" ? body.avatarImage.trim() : "";
    const text =
      typeof body?.text === "string" ? body.text.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: "Message text is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        player_name: name,
        avatar_url: avatarImage || null,
        message: text,
      })
      .select("id, player_name, avatar_url, message, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}