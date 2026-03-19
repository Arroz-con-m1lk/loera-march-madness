const TEAM_ALIASES: Record<string, string> = {
  "ole miss": "mississippi",
  "miss st": "mississippi state",
  "mississippi st": "mississippi state",
  "unc": "north carolina",
  "uconn": "connecticut",
  "saint marys": "saint mary's",
  "st marys": "saint mary's",
  "st johns": "saint john's",
  "uc san diego": "ucsd",
  "byu": "brigham young",
  "lsu": "louisiana state",
  "smu": "southern methodist",
  "tcu": "texas christian",
  "usc": "southern california",
  "uab": "alabama birmingham",
  "utah st": "utah state",
  "nc state": "north carolina state",
  "pitt": "pittsburgh",
  "texas a&m": "texas am",
  "texas a and m": "texas am",
};

const MASCOT_WORDS = new Set([
  "wildcats",
  "bulldogs",
  "bruins",
  "boilermakers",
  "wolverines",
  "blue",
  "devils",
  "spartans",
  "eagles",
  "tigers",
  "bears",
  "hawks",
  "jayhawks",
  "huskies",
  "aggies",
  "rebels",
  "volunteers",
  "gators",
  "cyclones",
  "cardinals",
  "longhorns",
  "raiders",
  "crimson",
  "tide",
  "irish",
  "tar",
  "heels",
  "orange",
  "storm",
  "wolfpack",
  "pirates",
  "trojans",
  "owls",
  "mustangs",
  "gaels",
  "lobos",
  "azorcs", // harmless if typo ever appears
  "broncos",
  "rams",
  "hoosiers",
  "illini",
  "knights",
  "catamounts",
  "mountaineers",
  "seminoles",
  "cougars",
  "ducks",
  "beavers",
  "terrapins",
  "horned",
  "frogs",
  "49ers",
  "golden",
  "grifffins",
  "grifins",
  "hurricanes",
  "sun",
  "devils",
  "shockers",
  "bearcats",
  "razorbacks",
  "crusaders",
  "dons",
  "lions",
  "phoenix",
  "flames",
  "matadors",
  "anteaters",
  "titans",
  "bruins",
]);

function basicClean(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[.'’()-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function applyAlias(name: string): string {
  return TEAM_ALIASES[name] ?? name;
}

function stripMascotWords(name: string): string {
  const words = name.split(" ");
  const filtered = words.filter((word) => !MASCOT_WORDS.has(word));
  return filtered.join(" ").trim();
}

export function normalizeTeamName(name: string): string {
  const cleaned = applyAlias(basicClean(name));
  const stripped = stripMascotWords(cleaned);
  return stripped || cleaned;
}

export function teamsMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false;

  const aClean = basicClean(a);
  const bClean = basicClean(b);

  const aAlias = applyAlias(aClean);
  const bAlias = applyAlias(bClean);

  const aNormalized = normalizeTeamName(a);
  const bNormalized = normalizeTeamName(b);

  return (
    aClean === bClean ||
    aAlias === bAlias ||
    aNormalized === bNormalized ||
    aNormalized.includes(bNormalized) ||
    bNormalized.includes(aNormalized)
  );
}