export type PlayerStatus = "confirmed" | "maybe" | "out";

export type BracketPickRound = {
  round: string;
  teams: string[];
};

export type BracketEntry = {
  id: string;
  label: string;
  image: string;
  paid: boolean;
  submitted: boolean;
  locked: boolean;
  score: number;
  championAlive: boolean;
  championPick?: string;
  notes?: string;
  readablePicks?: BracketPickRound[];
};

export type Player = {
  name: string;
  avatarImage: string;
  status: PlayerStatus;

  // legacy fields kept for compatibility with existing app logic
  paid: boolean;
  submitted: boolean;
  score: number;
  championAlive: boolean;

  grandmaMode?: boolean;
  aiGenerated?: boolean;
  bracketStyle?: string;

  brackets: BracketEntry[];
};

export const entryFee = 20;
export const extraBracketFee = 5;
export const maxBracketsPerPlayer = 4;

function createBracket(
  playerSlug: string,
  bracketNumber: number,
  options?: Partial<Omit<BracketEntry, "id" | "label" | "image">>
): BracketEntry {
  return {
    id: `${playerSlug}-${bracketNumber}`,
    label: `Bracket ${bracketNumber}`,
    image: `/brackets/${playerSlug}-${bracketNumber}.png`,
    paid: false,
    submitted: false,
    locked: false,
    score: 0,
    championAlive: true,
    championPick: "",
    notes: "",
    readablePicks: [],
    ...options,
  };
}

export const initialPlayers: Player[] = [
  {
    name: "Sandra",
    avatarImage: "/avatars/sandra.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("sandra", 1)],
  },
  {
    name: "Maria",
    avatarImage: "/avatars/maria.png",
    status: "confirmed",
    paid: true,
    submitted: true,
    score: 92,
    championAlive: true,
    brackets: [
      createBracket("maria", 1, {
        paid: true,
        submitted: true,
        locked: true,
        score: 92,
        championPick: "UCLA",
      }),
      createBracket("maria", 2, {
        paid: true,
        submitted: true,
        locked: true,
        score: 84,
        championPick: "Kansas",
      }),
    ],
  },
  {
    name: "Hugo",
    avatarImage: "/avatars/hugo.png",
    status: "confirmed",
    paid: true,
    submitted: false,
    score: 81,
    championAlive: true,
    brackets: [
      createBracket("hugo", 1, {
        paid: true,
        score: 81,
      }),
    ],
  },
  {
    name: "Aidan",
    avatarImage: "/avatars/aidan.png",
    status: "confirmed",
    paid: true,
    submitted: false,
    score: 77,
    championAlive: false,
    brackets: [
      createBracket("aidan", 1, {
        paid: true,
        submitted: true,
        locked: true,
        score: 77,
        championAlive: false,
        championPick: "Duke",
      }),
      createBracket("aidan", 2, {
        paid: true,
        submitted: true,
        locked: true,
        score: 63,
        championAlive: false,
        championPick: "Arizona",
      }),
    ],
  },
  {
    name: "Ben",
    avatarImage: "/avatars/ben.png",
    status: "confirmed",
    paid: true,
    submitted: true,
    score: 88,
    championAlive: true,
    brackets: [
      createBracket("ben", 1, {
        paid: true,
        submitted: true,
        locked: true,
        score: 88,
        championPick: "Houston",
      }),
      createBracket("ben", 2, {
        paid: true,
        submitted: true,
        locked: true,
        score: 71,
        championPick: "UConn",
      }),
      createBracket("ben", 3, {
        paid: true,
      }),
    ],
  },
  {
    name: "Grandma",
    avatarImage: "/avatars/grandma.png",
    status: "confirmed",
    paid: true,
    submitted: true,
    score: 95,
    championAlive: true,
    grandmaMode: true,
    aiGenerated: true,
    bracketStyle: "business-is-business",
    brackets: [
      createBracket("grandma", 1, {
        paid: true,
        submitted: true,
        locked: true,
        score: 95,
        championPick: "Duke",
      }),
    ],
  },
  {
    name: "Christian",
    avatarImage: "/avatars/christian.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("christian", 1)],
  },
  {
    name: "Jovana",
    avatarImage: "/avatars/jovana.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("jovana", 1)],
  },
  {
    name: "Alicia",
    avatarImage: "/avatars/alicia.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("alicia", 1)],
  },
  {
    name: "Elizabeth",
    avatarImage: "/avatars/elizabeth.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("elizabeth", 1)],
  },
  {
    name: "Oliver",
    avatarImage: "/avatars/oliver.png",
    status: "out",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: false,
    brackets: [createBracket("oliver", 1, { championAlive: false })],
  },
  {
    name: "Lilly",
    avatarImage: "/avatars/lilly.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("lilly", 1)],
  },
  {
    name: "Nick",
    avatarImage: "/avatars/nick.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("nick", 1)],
  },
  {
    name: "Melissa",
    avatarImage: "/avatars/melissa.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("melissa", 1)],
  },
  {
    name: "Stephan",
    avatarImage: "/avatars/stephan.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("stephan", 1)],
  },
  {
    name: "Matthew",
    avatarImage: "/avatars/matthew.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("matthew", 1)],
  },
  {
    name: "Marieli",
    avatarImage: "/avatars/marieli.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("marieli", 1)],
  },
  {
    name: "Alexa",
    avatarImage: "/avatars/alexa.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("alexa", 1)],
  },
  {
    name: "Racine",
    avatarImage: "/avatars/racine.png",
    status: "confirmed",
    paid: true,
    submitted: false,
    score: 69,
    championAlive: true,
    brackets: [
      createBracket("racine", 1, {
        paid: true,
        submitted: true,
        locked: true,
        score: 69,
        championPick: "Purdue",
      }),
      createBracket("racine", 2, {
        paid: true,
        submitted: true,
        locked: true,
        score: 58,
        championPick: "UCLA",
      }),
      createBracket("racine", 3),
      createBracket("racine", 4),
    ],
  },
  {
    name: "Milla",
    avatarImage: "/avatars/milla.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("milla", 1)],
  },
  {
    name: "Fernando",
    avatarImage: "/avatars/fernando.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("fernando", 1)],
  },
  {
    name: "Alex",
    avatarImage: "/avatars/alex.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("alex", 1)],
  },
  {
    name: "Richard",
    avatarImage: "/avatars/richard.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("richard", 1)],
  },
  {
    name: "Mary",
    avatarImage: "/avatars/mary.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("mary", 1)],
  },
  {
    name: "Jacob",
    avatarImage: "/avatars/jacob.png",
    status: "maybe",
    paid: false,
    submitted: false,
    score: 0,
    championAlive: true,
    brackets: [createBracket("jacob", 1)],
  },
];