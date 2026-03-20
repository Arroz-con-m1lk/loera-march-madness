const TEAM_ALIASES: Record<string, string> = {
  "ole miss": "mississippi",
  "miss st": "mississippi state",
  "mississippi st": "mississippi state",
  "unc": "north carolina",
  "uconn": "connecticut",
  "u conn": "connecticut",
  "saint marys": "saint mary's",
  "saint marys ca": "saint mary's",
  "st marys": "saint mary's",
  "st marys ca": "saint mary's",
  "st marys college": "saint mary's",
  "st johns": "saint john's",
  "st johns ny": "saint john's",
  "saint johns": "saint john's",
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
  "prairie view a&m": "prairie view",
  "prairie view a and m": "prairie view",
  "miami fl": "miami",
  "miami florida": "miami",
  "miami hurricanes": "miami",
  "miami oh": "miami ohio",
  "miami ohio": "miami ohio",
  "miamioh": "miami ohio",
  "saint louis": "saint louis",
  "st louis": "saint louis",
  "cal baptist": "california baptist",
  "ucf": "central florida",
  "ucla": "ucla",
  "vcu": "virginia commonwealth",
  "queens nc": "queens",
  "queens n c": "queens",
  "tennessee st": "tennessee state",
  "kennesaw st": "kennesaw state",
  "north dakota st": "north dakota state",
  "ohio st": "ohio state",
  "long island university": "long island",
  "liu": "long island",
  "ill st": "illinois state",
  "loyola chi": "loyola chicago",
  "loyola chicago ramblers": "loyola chicago",
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
  "azorcs",
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
  "griffins",
  "grifffins",
  "grifins",
  "hurricanes",
  "sun",
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
  "ramblers",
  "quakers",
  "bison",
  "quakers",
  "spartans",
  "wolves",
  "falcons",
  "panthers",
  "warriors",
  "red",
  "flash",
  "flashes",
]);

function basicClean(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bsaint\b/g, "saint")
    .replace(/\bst\b/g, "saint")
    .replace(/[.'’(),/-]/g, " ")
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

function stripStateQualifiers(name: string): string {
  return name
    .replace(/\bflorida\b/g, "fl")
    .replace(/\bohio\b/g, "oh")
    .replace(/\bnorth carolina\b/g, "nc")
    .replace(/\bcalifornia\b/g, "ca")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForCompare(name: string): string {
  const cleaned = basicClean(name);
  const aliased = applyAlias(cleaned);
  const noMascot = stripMascotWords(aliased);
  const reAliased = applyAlias(noMascot);
  return reAliased || aliased || cleaned;
}

export function normalizeTeamName(name: string): string {
  const normalized = normalizeForCompare(name);
  return normalized;
}

export function teamsMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false;

  const aClean = basicClean(a);
  const bClean = basicClean(b);

  const aAlias = applyAlias(aClean);
  const bAlias = applyAlias(bClean);

  const aNormalized = normalizeTeamName(a);
  const bNormalized = normalizeTeamName(b);

  const aState = stripStateQualifiers(aNormalized);
  const bState = stripStateQualifiers(bNormalized);

  if (
    aClean === bClean ||
    aAlias === bAlias ||
    aNormalized === bNormalized ||
    aState === bState
  ) {
    return true;
  }

  if (!aNormalized || !bNormalized) return false;

  const shorter = aNormalized.length <= bNormalized.length ? aNormalized : bNormalized;
  const longer = aNormalized.length > bNormalized.length ? aNormalized : bNormalized;

  if (shorter.length >= 5 && longer.includes(shorter)) {
    return true;
  }

  return false;
}