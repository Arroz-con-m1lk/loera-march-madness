import { NextResponse } from "next/server";

type EspnTeam = {
  displayName?: string;
  abbreviation?: string;
  shortDisplayName?: string;
  links?: { href?: string }[];
};

type EspnCompetitor = {
  homeAway?: "home" | "away";
  winner?: boolean;
  score?: string;
  curatedRank?: { current?: number };
  team?: EspnTeam;
  seed?: string;
};

type EspnCompetition = {
  competitors?: EspnCompetitor[];
  status?: {
    type?: {
      name?: string;
      state?: string;
      description?: string;
      shortDetail?: string;
      completed?: boolean;
    };
  };
};

type EspnEvent = {
  id?: string;
  date?: string;
  name?: string;
  shortName?: string;
  links?: { href?: string }[];
  competitions?: EspnCompetition[];
  status?: {
    type?: {
      name?: string;
      state?: string;
      description?: string;
      shortDetail?: string;
      completed?: boolean;
    };
  };
};

type EspnScoreboardResponse = {
  events?: EspnEvent[];
};

function formatDateLabel(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTimeLabel(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function yyyymmdd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function buildDateRange() {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  // Wider range so completed tournament games stay available for scoring
  start.setDate(start.getDate() - 30);
  end.setDate(end.getDate() + 7);

  return `${yyyymmdd(start)}-${yyyymmdd(end)}`;
}

function getTeamLink(
  competitor: EspnCompetitor | undefined,
  fallback: string
): string {
  return competitor?.team?.links?.[0]?.href ?? fallback;
}

function cleanTeamName(value?: string) {
  return (value ?? "").trim();
}

function canonicalTeamName(competitor?: EspnCompetitor) {
  return (
    cleanTeamName(competitor?.team?.displayName) ||
    cleanTeamName(competitor?.team?.shortDisplayName) ||
    cleanTeamName(competitor?.team?.abbreviation) ||
    ""
  );
}

function inferRoundLabel(event: EspnEvent, statusDescription: string, shortDetail: string) {
  const haystack = `${event.name ?? ""} ${event.shortName ?? ""} ${statusDescription} ${shortDetail}`.toLowerCase();

  if (haystack.includes("first four")) return "First Four";
  if (haystack.includes("round of 64")) return "Round of 64";
  if (haystack.includes("first round")) return "Round of 64";
  if (haystack.includes("1st round")) return "Round of 64";

  if (haystack.includes("round of 32")) return "Round of 32";
  if (haystack.includes("second round")) return "Round of 32";
  if (haystack.includes("2nd round")) return "Round of 32";

  if (haystack.includes("sweet 16")) return "Sweet 16";
  if (haystack.includes("elite 8")) return "Elite 8";
  if (haystack.includes("elite eight")) return "Elite 8";

  if (haystack.includes("final four")) return "Final 4";
  if (haystack.includes("national semifinal")) return "Final 4";
  if (haystack.includes("semifinal")) return "Final 4";

  if (haystack.includes("championship")) return "Championship";
  if (haystack.includes("title game")) return "Championship";
  if (haystack.includes("national title")) return "Championship";

  return null;
}

function normalizeEvent(event: EspnEvent) {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];

  const away = competitors.find((team) => team.homeAway === "away");
  const home = competitors.find((team) => team.homeAway === "home");

  if (!away || !home || !event.id || !event.date) {
    return null;
  }

  const status =
    competition?.status?.type ??
    event.status?.type ?? {
      name: "STATUS_UNKNOWN",
      state: "pre",
      description: "Scheduled",
      shortDetail: "Scheduled",
      completed: false,
    };

  const awayDisplay =
    away.team?.shortDisplayName ||
    away.team?.displayName ||
    away.team?.abbreviation ||
    "Away";

  const homeDisplay =
    home.team?.shortDisplayName ||
    home.team?.displayName ||
    home.team?.abbreviation ||
    "Home";

  const awayCanonical = canonicalTeamName(away);
  const homeCanonical = canonicalTeamName(home);

  const winnerCanonical = away.winner
    ? awayCanonical
    : home.winner
      ? homeCanonical
      : null;

  const loserCanonical = away.winner
    ? homeCanonical
    : home.winner
      ? awayCanonical
      : null;

  const statusDescription = status.description || "Scheduled";
  const shortDetail = status.shortDetail || formatTimeLabel(event.date);
  const roundLabel = inferRoundLabel(event, statusDescription, shortDetail);

  return {
    id: event.id,
    name: event.name || event.shortName || `${awayDisplay} vs ${homeDisplay}`,
    shortName: event.shortName || `${awayDisplay} vs ${homeDisplay}`,

    awayTeam: awayDisplay,
    homeTeam: homeDisplay,

    awayCanonicalTeam: awayCanonical || awayDisplay,
    homeCanonicalTeam: homeCanonical || homeDisplay,

    awaySeed: away.seed ?? undefined,
    homeSeed: home.seed ?? undefined,

    awayRank:
      away.curatedRank?.current !== undefined
        ? String(away.curatedRank.current)
        : undefined,

    homeRank:
      home.curatedRank?.current !== undefined
        ? String(home.curatedRank.current)
        : undefined,

    awayLink: getTeamLink(
      away,
      "https://www.espn.com/mens-college-basketball/"
    ),

    homeLink: getTeamLink(
      home,
      "https://www.espn.com/mens-college-basketball/"
    ),

    dateLabel: formatDateLabel(event.date),
    timeLabel: shortDetail,
    epoch: new Date(event.date).getTime(),

    gameState: status.name || "STATUS_UNKNOWN",
    statusDescription,
    completed: Boolean(status.completed),

    roundLabel,

    winner: away.winner ? away.team?.displayName : home.winner ? home.team?.displayName : null,
    loser: away.winner ? home.team?.displayName : home.winner ? away.team?.displayName : null,

    winnerCanonical: winnerCanonical || null,
    loserCanonical: loserCanonical || null,

    awayScore: away.score ? Number(away.score) : null,
    homeScore: home.score ? Number(home.score) : null,
  };
}

export async function GET() {
  try {
    const dates = buildDateRange();

    const url =
      `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard` +
      `?dates=${dates}&groups=50&limit=500`;

    const response = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          games: [],
          liveGames: [],
          finals: [],
          completedByRound: {},
          updatedAt: new Date().toISOString(),
          error: `ESPN request failed with status ${response.status}`,
        },
        { status: 200 }
      );
    }

    const data = (await response.json()) as EspnScoreboardResponse;

    const normalized = (data.events ?? [])
      .map(normalizeEvent)
      .filter(Boolean)
      .sort((a, b) => a!.epoch - b!.epoch) as NonNullable<
      ReturnType<typeof normalizeEvent>
    >[];

    const liveGames = normalized.filter((game) =>
      ["STATUS_IN_PROGRESS", "STATUS_HALFTIME", "STATUS_END_PERIOD"].includes(
        game.gameState
      )
    );

    const finals = normalized.filter((game) => game.completed);

    const upcomingGames = normalized.filter(
      (game) =>
        !game.completed &&
        !["STATUS_IN_PROGRESS", "STATUS_HALFTIME", "STATUS_END_PERIOD"].includes(
          game.gameState
        )
    );

    const completedByRound = finals.reduce<Record<string, typeof finals>>(
      (acc, game) => {
        const key = game.roundLabel ?? "Unclassified";
        if (!acc[key]) acc[key] = [];
        acc[key].push(game);
        return acc;
      },
      {}
    );

    return NextResponse.json({
      games: upcomingGames,
      liveGames,
      finals,
      completedByRound,
      updatedAt: new Date().toISOString(),
      error: "",
    });
  } catch (error) {
    return NextResponse.json(
      {
        games: [],
        liveGames: [],
        finals: [],
        completedByRound: {},
        updatedAt: new Date().toISOString(),
        error:
          error instanceof Error
            ? error.message
            : "Could not load ESPN scoreboard data.",
      },
      { status: 200 }
    );
  }
}