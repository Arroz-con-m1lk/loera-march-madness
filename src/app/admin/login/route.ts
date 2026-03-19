import { NextResponse } from "next/server";
import { initialPlayers } from "../../../data/players";

type LoginBody = {
  name?: string;
  pin?: string;
};

// Temporary simple PIN map while you build the real admin reset flow.
// Change these to the 4-digit PINs you want for each player.
const PLAYER_PINS: Record<string, string> = {
  sandra: "1111",
  maria: "2222",
  hugo: "3333",
  aidan: "4444",
  ben: "5555",
  grandma: "6666",
  christian: "7777",
  jovana: "8888",
  alicia: "9999",
  elizabeth: "1234",
  oliver: "2345",
  lilly: "3456",
  nick: "4567",
  melissa: "5678",
  stephan: "6789",
  matthew: "7890",
  marieli: "2468",
  alexa: "1357",
  racine: "2580",
  milla: "1122",
  fernando: "2233",
  alex: "3344",
  richard: "4455",
  mary: "5566",
  jacob: "6677",
};

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;

    const rawName = body.name?.trim() ?? "";
    const rawPin = body.pin?.trim() ?? "";

    if (!rawName || !rawPin) {
      return NextResponse.json(
        { error: "Name and PIN are required." },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(rawPin)) {
      return NextResponse.json(
        { error: "PIN must be exactly 4 digits." },
        { status: 400 }
      );
    }

    const normalizedName = normalizeName(rawName);

    const player = initialPlayers.find(
      (entry) => normalizeName(entry.name) === normalizedName
    );

    if (!player) {
      return NextResponse.json(
        { error: "Invalid name or PIN." },
        { status: 401 }
      );
    }

    const expectedPin = PLAYER_PINS[normalizedName];

    if (!expectedPin || expectedPin !== rawPin) {
      return NextResponse.json(
        { error: "Invalid name or PIN." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      name: player.name,
      avatarImage: player.avatarImage,
      status: player.status,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to process login." },
      { status: 500 }
    );
  }
}