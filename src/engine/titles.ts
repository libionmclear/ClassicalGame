// HEGEMON — titles.ts (Design Brief §11): the civ TITLE LADDERS. You climb a
// people's historically authentic career ladder by earning LAURELS with that
// civ (wins, achievements, Crossroads outcomes). Pure data + lookup logic; the
// client (game.js) stores laurels on the profile and shows the current title.
// Every rung carries a one-line note — the educational Codex layer of §11.

export interface TitleRung {
  name: string;
  note: string;
}

// Cumulative laurels a rung needs (rung 0 is free). Shared across ladders — a
// shorter ladder simply tops out at a lower rung.
export const LAUREL_THRESHOLDS = [0, 3, 7, 12, 18, 25, 34, 45, 58, 73, 90];

// The eight launch civs' ladders (Brief §11), each grounded in the real office.
export const TITLE_LADDERS: Record<string, TitleRung[]> = {
  rome: [
    { name: "Servus", note: "A slave — the bottom of Rome's steep ladder, yet a freedman's son could rise." },
    { name: "Libertus", note: "A freedman, manumitted but still bound by duty to his former master's house." },
    { name: "Plebeius", note: "A commoner of the plebs, who won tribunes to guard the people's rights." },
    { name: "Civis", note: "A Roman citizen — the proud claim 'Civis Romanus sum' that shielded a man across the world." },
    { name: "Eques", note: "A knight of the equestrian order, wealthy enough to keep a horse and finance the state." },
    { name: "Quaestor", note: "The first rung of the cursus honorum: a magistrate of the treasury and the army's pay." },
    { name: "Aedilis", note: "Overseer of streets, markets, and the games — a costly office that bought a career." },
    { name: "Praetor", note: "A judge and, in war, a commander with imperium second only to the consuls." },
    { name: "Consul", note: "One of two chief magistrates elected yearly, each able to veto the other — Rome's check on one-man rule." },
    { name: "Censor", note: "Guardian of the census and public morals; even ex-consuls sought this crowning honour." },
    { name: "Princeps", note: "'First citizen' — the title Augustus took to rule as emperor while pretending the Republic lived." }
  ],
  egypt: [
    { name: "Peasant of the Black Land", note: "A farmer of the dark Nile silt (kemet) whose flood fed all Egypt." },
    { name: "Scribe", note: "A literate servant of the state — in Egypt, the pen opened every door." },
    { name: "Priest of Amun", note: "A servant of the hidden god of Thebes, whose temples rivalled the throne." },
    { name: "Overseer", note: "A manager of granaries, works, or labour gangs for the crown." },
    { name: "Nomarch", note: "Governor of a nome (province) — in weak times, a king in miniature." },
    { name: "Vizier", note: "The chief minister (tjaty), who ran the kingdom in Pharaoh's name." },
    { name: "Regent of the Two Lands", note: "Ruler of Upper and Lower Egypt, the reed and the bee joined under one crown." }
  ],
  greece: [
    { name: "Metic", note: "A resident foreigner of the polis — free and useful, but never a citizen." },
    { name: "Citizen", note: "A polites, sharing in the assembly and the duties of the city-state." },
    { name: "Hoplite", note: "A citizen-soldier who bought his own shield and stood in the phalanx line." },
    { name: "Choregos", note: "A wealthy patron who funded a tragic chorus — civic glory through generosity." },
    { name: "Strategos", note: "An elected general; at Athens, Pericles held the office year after year." },
    { name: "Archon", note: "A chief magistrate of the city; the archon eponymos gave his name to the year." },
    { name: "Hegemon", note: "Leader of a league of cities — the hegemony Athens and Sparta each fought to hold." }
  ],
  carthage: [
    { name: "Deckhand", note: "A hand aboard the ships that made Carthage mistress of the western sea." },
    { name: "Merchant", note: "A trader in Tyrian purple, silver, and grain across the Mediterranean." },
    { name: "Shipmaster", note: "Captain of a merchantman or a war-galley of the great harbour." },
    { name: "Rab", note: "A commander or chief — the Punic title of those who led men and fleets." },
    { name: "Member of the Hundred-and-Four", note: "One of the tribunal of judges who kept even generals in fear of the state." },
    { name: "Shophet", note: "One of two chief magistrates ('judges') elected yearly to head the republic." }
  ],
  gaul: [
    { name: "Farmhand", note: "A worker of the fields of Gaul, rich in grain, cattle, and iron." },
    { name: "Warrior", note: "A sworn fighter of the tribe, glory-hungry and fearsome in the charge." },
    { name: "Chieftain's Companion", note: "One of the ambacti, the retainers who ate at a chief's hall and died at his side." },
    { name: "Noble", note: "An equites of Gaul — a horse-owning aristocrat with clients of his own." },
    { name: "Druid's Counsel", note: "Trusted of the druids, who judged disputes and kept the tribe's law and lore." },
    { name: "Vergobret", note: "The supreme elected magistrate of a Gallic people, holding power for one year." }
  ],
  britons: [
    { name: "Herdsman", note: "A keeper of cattle and sheep on the green, misty isle." },
    { name: "Charioteer", note: "A driver of the war-chariots that so unnerved the legions on the beaches." },
    { name: "Clan Champion", note: "The chosen fighter of a clan, first into the fray and first in honour." },
    { name: "Chieftain", note: "Lord of a British tribe — the Trinovantes, Iceni, or Catuvellauni." },
    { name: "High King/Queen", note: "Over-ruler of many tribes — as Cunobelinus reigned, and Boudica led in revolt." }
  ],
  parthia: [
    { name: "Herdsman", note: "A breeder of the great Nisaean horses of the Iranian plateau." },
    { name: "Horse Archer", note: "A rider of the 'Parthian shot', loosing arrows in feigned retreat." },
    { name: "Azat", note: "A free noble of the warrior aristocracy who owed the king cavalry, not coin." },
    { name: "Satrap", note: "Governor of a province, ruling in the King of Kings' name over vast distances." },
    { name: "Spahbed", note: "A supreme army commander — one broke Crassus and Rome at Carrhae in 53 BC." },
    { name: "King of Kings", note: "The Šāhān Šāh, overlord of the many kings and satraps of the Parthian realm." }
  ],
  kush: [
    { name: "Farmer of the Cataracts", note: "A tiller of the narrow green banks between the Nile's rocky cataracts." },
    { name: "Bowman", note: "An archer of Ta-Seti, 'the Land of the Bow' — Kush's most famous export was skill with it." },
    { name: "Master of Meroë's Furnaces", note: "An ironmaster of Meroë, whose smelters earned it a name among the world's metalworkers." },
    { name: "Priest of Apedemak", note: "A servant of the lion-headed war god of Kush, distinct from Egypt's own gods." },
    { name: "Qore / Kandake", note: "The king (qore) or the powerful queen mother (kandake) who ruled from Meroë." }
  ]
};

const LADDER_ALIAS: Record<string, string> = { greeks: "greece", athens: "greece", gauls: "gaul", nubia: "kush" };
function ladderKey(civ: string): string {
  const k = String(civ || "").toLowerCase();
  return TITLE_LADDERS[k] ? k : LADDER_ALIAS[k] || k;
}

export function titleIndexForLaurels(civ: string, laurels: number): number {
  const ladder = TITLE_LADDERS[ladderKey(civ)];
  if (!ladder || !ladder.length) return 0;
  let idx = 0;
  for (let i = 0; i < ladder.length; i += 1) if (laurels >= (LAUREL_THRESHOLDS[i] ?? Infinity)) idx = i;
  return idx;
}

export function titleForLaurels(civ: string, laurels: number): TitleRung | null {
  const ladder = TITLE_LADDERS[ladderKey(civ)];
  if (!ladder || !ladder.length) return null;
  return ladder[titleIndexForLaurels(civ, laurels)];
}

// The next rung and how many more laurels it needs — null if already at the top.
export function nextTitleInfo(civ: string, laurels: number): { name: string; need: number } | null {
  const ladder = TITLE_LADDERS[ladderKey(civ)];
  if (!ladder || !ladder.length) return null;
  const i = titleIndexForLaurels(civ, laurels);
  if (i >= ladder.length - 1) return null;
  return { name: ladder[i + 1].name, need: Math.max(0, (LAUREL_THRESHOLDS[i + 1] ?? Infinity) - laurels) };
}

// Laurels a finished game is worth (a win far more than a loss; domination more still).
export function laurelsForGame(won: boolean, victoryType?: string | null): number {
  if (!won) return 1;
  return victoryType === "domination" ? 4 : 3;
}
