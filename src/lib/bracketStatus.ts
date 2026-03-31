export type BracketStatus = "alive" | "lame_duck" | "busted";

export function getBracketStatus({
  championAlive,
  busted,
}: {
  championAlive: boolean;
  busted: boolean;
}): BracketStatus {
  if (busted) return "busted";
  if (!championAlive) return "lame_duck";
  return "alive";
}

export function getBracketStatusLabel(status: BracketStatus): string {
  switch (status) {
    case "alive":
      return "ALIVE";
    case "lame_duck":
      return "LAME DUCK";
    case "busted":
      return "BUSTED";
  }
}

export function getBracketStatusColor(status: BracketStatus): string {
  switch (status) {
    case "alive":
      return "text-emerald-400";
    case "lame_duck":
      return "text-yellow-300";
    case "busted":
      return "text-red-400";
  }
}