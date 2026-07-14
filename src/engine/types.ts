export type TerrainType =
  | "plains"
  | "valley"
  | "forest"
  | "hills"
  | "highlands"
  | "mountains"
  | "desert"
  | "coast"
  | "sea";

export type WeatherType = "clear" | "rain" | "fog" | "storm" | "heat";

export type DomainType = "land" | "naval" | "civilian";
export type Veterancy = "recruit" | "veteran" | "elite";
export type Difficulty = "easy" | "normal" | "hard";

export interface Coord {
  q: number;
  r: number;
}

export interface Tile {
  terrain: TerrainType;
  region: string;
  /** A worked improvement (farm, mine, …) that boosts the owning city's yields. */
  improvement?: string;
  /** A road speeds movement across the tile and bridges rivers. */
  road?: boolean;
  /** A strategic resource deposit (grain, iron, timber, …) — bonus yields when worked. */
  resource?: string;
}

export interface TerrainRule {
  moveCost: number;
  yields: { food: number; production: number; gold: number };
  defense: number;
  vision: number;
  impassableWithoutTech?: string;
  navalOnly?: boolean;
  requiresTech?: string;
}

export interface UnitRule {
  domain: DomainType;
  movement: number;
  attack: number;
  defense: number;
  maxHp: number;
  range: number;
  upkeep: number;
  mounted?: boolean;
  /** Tech that must be researched before this unit can be built. */
  requiresTech?: string;
  /** Tactical role used for the counter matrix: infantry | spear | heavy | ranged | mounted | siege. */
  category?: string;
  /** Combat multiplier bonus vs a defender/attacker of the given category (applies both ways). */
  counters?: Record<string, number>;
  /** Extra attack multiplier when assaulting a city (siege engines). */
  siegeBonus?: number;
  /** Civ id (lowercase, e.g. "rome") this unit is unique to — only that people may field it. */
  civ?: string;
  /** Base unit type this one upgrades from in the field (e.g. legionary from swordsman). */
  upgradesFrom?: string;
  /** Max this player may ever have alive+queued (elite guards: praetorian, spartiate). */
  buildCap?: number;
  /** A named special behaviour (e.g. "hit-and-run" — keep moving after attacking). */
  special?: string;
}

export interface TechRule {
  age: 1 | 2 | 3;
  prerequisites: string[];
  forkGroup?: string;
  forkBranch?: string;
  /** Civ id (lowercase, e.g. "rome") this tech is unique to — only that people may research it. */
  civ?: string;
  /** Explicit science cost; DEPRECATED — cost now derives from age×tier (v2.1 §3b). */
  cost?: number;
  /** Cost multiplier override on the depth-tiered formula (v2.1 §3b): e.g. 0.7 for a
   *  cheap utility side-tech, 1.2 for a luxury convenience. Data wins over formula. */
  costMod?: number;
  /** v2 civ-unique branch techs carry a display name, history note, effect block,
   *  and a capstone flag (the branch's terminal doctrine). */
  name?: string;
  note?: string;
  capstone?: boolean;
  effect?: Record<string, unknown>;
}

export interface Unit {
  id: string;
  type: string;
  ownerId: string;
  position: Coord;
  hp: number;
  maxHp: number;
  movementRemaining: number;
  veterancy: Veterancy;
  /** The city this unit was recruited from (Cities v3 §1). Disbanding a citizen
   *  military unit returns its population here, prorated by health. */
  homeCityId?: string;
  /** Hired for gold, not drawn from population — no pop cost, no disband return. */
  mercenary?: boolean;
}

export interface City {
  id: string;
  ownerId: string;
  /** Player-facing name (defaults to a generated one if unset). */
  name?: string;
  position: Coord;
  population: number;
  hp: number;
  maxHp: number;
  isCapital?: boolean;
  /** Accumulated food toward the next population growth. */
  food?: number;
  /** Ids of buildings constructed in this city. */
  buildings?: string[];
  /** Production banked toward the front of the build queue. */
  production?: number;
  /** Ordered build queue of item ids (unit type or building id). */
  queue?: string[];
  /** Turn this city was last assaulted — it only heals when left in peace. */
  lastAttackedTurn?: number;
  /** Turn this city last changed hands — a fresh conquest is briefly unstable. */
  capturedTurn?: number;
  /** Cities v3 §2 — districts built on the 6 hexes around the centre. */
  districts?: District[];
}

/** A district occupies one of the six hexes adjacent to the city centre. */
export interface District {
  /** Key of the hex it sits on ("q,r"). */
  hex: string;
  /** District type id (civic/market/aqueduct/…/greatwork) or, for a Great Work, its card id. */
  type: string;
  /** A pillaged district yields nothing until repaired with labour. */
  pillaged?: boolean;
  /** For a GREAT WORK district: the owned Great Work card id. */
  work?: string;
}

export interface Player {
  id: string;
  civ: string;
  food: number;
  production: number;
  gold: number;
  science: number;
  techs: string[];
  forkChoices: Record<string, string>;
  cityIds: string[];
  unitIds: string[];
  /** A Crossroads event awaiting the player's decision (event id), if any. */
  pendingEvent?: string;
  /** Turn the player's last event fired, to space them out. */
  lastEventTurn?: number;
  /** Small flat per-turn bonuses from equipped General cards (the meta-game).
   *  gold/science are added to the player pool; food/production to the capital. */
  perks?: {
    food?: number; production?: number; gold?: number; science?: number; stability?: number;
    /** Flat combat % from equipped cards (Slice 1 — card effect wiring). */
    atkPct?: number; defPct?: number;
    /** Cost/upkeep/research % from equipped cards (Slice 2). */
    unitCostPct?: number; upkeepPct?: number; researchCostPct?: number; buildFasterPct?: number;
    /** Flat move / heal from equipped cards (Slice 4). */
    movePlus?: number; navalMovePlus?: number; healPlus?: number;
  };
  /** Turn the Oathbreaker brand lifts (Diplomacy §3); absent = not branded. */
  oathbreakerUntil?: number;
  /** A diplomatic offer awaiting this player's decision (Diplomacy §2). */
  pendingProposal?: PendingProposal;
  /** Overlord's id if this player is a vassal (Diplomacy §4); absent = sovereign. */
  vassalOf?: string;
  /** Overlord's military strength when vassalage began (rebellion trigger). */
  overlordMilBaseline?: number;
  /** Codex entries unlocked by discovery (ruin ids fully excavated, §10). */
  codex?: string[];
}

export interface GameMap {
  width: number;
  height: number;
  tiles: Record<string, Tile>;
  rivers: Record<string, boolean>;
  regions: string[];
  cities: Record<string, City>;
  units: Record<string, Unit>;
  /** Ancient ruins to excavate (§10.2), keyed by tile "q,r". `full` = dug by an Explorer (whole reward). */
  ruins?: Record<string, { ruinId: string; excavated?: boolean; by?: string; full?: boolean }>;
  /** Minor-People villages (§10.3), keyed by tile "q,r". */
  villages?: Record<string, { peopleId: string; disposition: "open" | "wary" | "hostile"; befriendedBy?: string; contacted?: boolean; attempts?: number }>;
}

export interface WeatherState {
  current: Record<string, WeatherType>;
  forecast: Record<string, WeatherType>;
}

export interface TradeRoute {
  ownerId: string;
  /** The owner's home city that anchors the route (must stay owned to earn). */
  fromCityId: string;
  /** The destination city the merchant reached (may be foreign). */
  toCityId: string;
  /** Gold delivered to the owner each turn while the route stands. */
  gold: number;
}

export interface GameState {
  version: number;
  seed: string;
  turn: number;
  /** Match ends and score is tallied once turn passes this. 0 = no limit (domination only). */
  turnLimit: number;
  /** AI economic handicap applied to every non-human player. */
  difficulty: Difficulty;
  /** The one player exempt from the difficulty handicap (the human), if any. */
  humanPlayerId: string | null;
  currentPlayerIndex: number;
  players: Player[];
  playersById: Record<string, Player>;
  map: GameMap;
  weather: WeatherState;
  /** Standing trade routes, each paying its owner gold every turn. */
  tradeRoutes: TradeRoute[];
  actionLog: ActionLogEntry[];
  /** Tiles each player has ever seen (persists fog-of-war across reloads). */
  discovered?: Record<string, string[]>;
  /** Research + build cost multiplier — bigger maps take longer to develop. */
  costScale?: number;
  /** Diplomacy state, keyed by canonical civ-pair key (see diplomacy.ts). */
  diplomacy?: Record<string, DiploPair>;
  /** Whether a joint Full-Alliance victory is allowed (§6; default true). */
  allianceVictory?: boolean;
  /** Per-player chosen general/Legend, feeding diplomacy rolls (§10.3 / cards). Keyed by player id. */
  leaders?: Record<string, { id: string; name?: string; role: string; rarity: string }>;
  /** Civs each player has made first contact with (via an Explorer envoy or borders). Keyed by player id → met player ids. */
  contact?: Record<string, string[]>;
  /** Transient: outcome of the most recent Minor-People reaction roll, for the client to surface. Reset each applyAction. */
  lastReaction?: {
    hex: string;
    peopleId: string;
    action: "befriend" | "tribute" | "assimilate";
    comply: boolean;
    chance: number;
    playerId: string;
    message: string;
  };
}

/** An agreement on a civ-pair. `expires` is the turn it lapses (0 = no expiry). */
export interface DiploAgreement {
  type: "trade-pact" | "nap" | "passage" | "defensive-alliance" | "full-alliance";
  expires: number;
  /** Turn it was formed (for "held N turns" ladder prerequisites). */
  since?: number;
}

// Per civ-pair diplomatic state (Diplomacy v1 §8). Phase 1 uses `relation` +
// `agreements`; the rest are reserved so later slices extend without a migration.
export interface DiploPair {
  /** −100..+100; five bands via relationBand(). */
  relation: number;
  agreements: DiploAgreement[];
  /** Turn a Denounce was issued (starts the pre-hostilities cooldown). */
  denouncedAt?: number;
  /** One-way tribute for guaranteed peace. */
  tribute?: { to: string; amount: number; expires: number } | null;
  /** Turn the pair entered its current war (for war-weariness); absent = at peace. */
  warSince?: number;
}

export interface ActionLogEntry {
  turn: number;
  playerId: string;
  action: GameAction;
}

export interface MoveUnitAction {
  type: "MOVE_UNIT";
  playerId: string;
  unitId: string;
  destination: Coord;
  path?: Coord[];
}

export interface AttackAction {
  type: "ATTACK";
  playerId: string;
  attackerId: string;
  defenderId: string;
}

export interface ResearchTechAction {
  type: "RESEARCH_TECH";
  playerId: string;
  techId: string;
}

export interface ChooseForkAction {
  type: "CHOOSE_FORK";
  playerId: string;
  forkGroup: string;
  branch: string;
}

export interface EndTurnAction {
  type: "END_TURN";
  playerId: string;
}

export interface FoundCityAction {
  type: "FOUND_CITY";
  playerId: string;
  settlerId: string;
  cityId: string;
}

export interface BuildUnitAction {
  type: "BUILD_UNIT";
  playerId: string;
  cityId: string;
  unitType: string;
  unitId: string;
}

export interface AttackCityAction {
  type: "ATTACK_CITY";
  playerId: string;
  attackerId: string;
  cityId: string;
}

export interface ResolveEventAction {
  type: "RESOLVE_EVENT";
  playerId: string;
  eventId: string;
  optionIndex: number;
}

export interface BuildBuildingAction {
  type: "BUILD_BUILDING";
  playerId: string;
  cityId: string;
  buildingId: string;
}

export interface UnqueueProductionAction {
  type: "UNQUEUE_PRODUCTION";
  playerId: string;
  cityId: string;
  index: number;
}

export interface RushProductionAction {
  type: "RUSH_PRODUCTION";
  playerId: string;
  cityId: string;
}

export interface EstablishTradeRouteAction {
  type: "ESTABLISH_TRADE_ROUTE";
  playerId: string;
  merchantId: string;
  /** The destination city the merchant has reached (on or adjacent to it). */
  cityId: string;
}

export interface UpgradeUnitAction {
  type: "UPGRADE_UNIT";
  playerId: string;
  unitId: string;
}

export interface RenameCityAction {
  type: "RENAME_CITY";
  playerId: string;
  cityId: string;
  name: string;
}

export interface DisbandUnitAction {
  type: "DISBAND_UNIT";
  playerId: string;
  unitId: string;
}

export interface ImproveTileAction {
  type: "IMPROVE_TILE";
  playerId: string;
  /** The city that will fund the work from its labour queue. */
  cityId: string;
  /** Axial "q,r" key of the tile to improve (must be in the player's territory). */
  tileKey: string;
  /** Improvement id (farm, mine, …); must suit the tile's terrain. */
  improvement: string;
}

export interface BuildDistrictAction {
  type: "BUILD_DISTRICT";
  playerId: string;
  cityId: string;
  /** District type id, or a Great Work card id you own. */
  districtType: string;
  /** Axial "q,r" of one of the six hexes adjacent to the city. */
  hex: string;
}

export interface RepairDistrictAction {
  type: "REPAIR_DISTRICT";
  playerId: string;
  cityId: string;
  /** Axial "q,r" of the pillaged district to repair. */
  hex: string;
}

// Diplomacy (Cities/Diplomacy v1 §1) — a gift of gold warms relations.
export interface GiftGoldAction {
  type: "GIFT_GOLD";
  playerId: string;
  /** The civ receiving the gift. */
  targetId: string;
  amount: number;
}

// Diplomacy §3 — a formal war declaration (the alternative to a surprise attack).
export interface DeclareWarAction {
  type: "DECLARE_WAR";
  playerId: string;
  targetId: string;
}

// Diplomacy §2 — propose a Trade Pact or NAP; the target holds it as a pending
// proposal until they RESOLVE it.
export interface ProposeAgreementAction {
  type: "PROPOSE_AGREEMENT";
  playerId: string;
  targetId: string;
  agreementType: "trade-pact" | "nap" | "passage" | "defensive-alliance" | "full-alliance";
}
export interface ResolveProposalAction {
  type: "RESOLVE_PROPOSAL";
  /** The player holding the pending proposal (the one deciding). */
  playerId: string;
  accept: boolean;
}
// Diplomacy §4 — offer one-way gold/turn for guaranteed peace.
export interface OfferTributeAction {
  type: "OFFER_TRIBUTE";
  playerId: string;
  targetId: string;
  amount: number;
  turns: number;
}
// Diplomacy §2 — a public denouncement (relation hit; starts the cooldown that
// lets you later leave a pact without the Oathbreaker brand).
export interface DenounceAction {
  type: "DENOUNCE";
  playerId: string;
  targetId: string;
}
// Diplomacy §4 — propose a vassalage: DEMAND (vassalId === targetId, needs a 2:1
// military edge) or SUBMIT (vassalId === playerId). The target decides.
export interface ProposeVassalageAction {
  type: "PROPOSE_VASSALAGE";
  playerId: string;
  targetId: string;
  /** Which party becomes the vassal — playerId (submit) or targetId (demand). */
  vassalId: string;
}
// Diplomacy §4 — an overlord frees a vassal.
export interface ReleaseVassalAction {
  type: "RELEASE_VASSAL";
  playerId: string;
  /** The vassal being released. */
  targetId: string;
}

// Minor Peoples (§10.3) — interact with a village (identified by its tile "q,r").
export interface BefriendVillageAction { type: "BEFRIEND_VILLAGE"; playerId: string; hex: string; }
export interface DemandTributeVillageAction { type: "DEMAND_TRIBUTE_VILLAGE"; playerId: string; hex: string; }
export interface ConquerVillageAction { type: "CONQUER_VILLAGE"; playerId: string; hex: string; }
export interface AbsorbVillageAction { type: "ABSORB_VILLAGE"; playerId: string; hex: string; mode: "join" | "migrate"; }

/** A diplomatic proposal awaiting a player's yes/no (like a pending event). */
export interface PendingProposal {
  from: string;
  kind: "trade-pact" | "nap" | "tribute" | "passage" | "defensive-alliance" | "full-alliance" | "vassalage";
  amount?: number;
  turns?: number;
  /** For a vassalage offer — which party would become the vassal. */
  vassalId?: string;
}

export type GameAction =
  | MoveUnitAction
  | AttackAction
  | ResearchTechAction
  | ChooseForkAction
  | EndTurnAction
  | FoundCityAction
  | BuildUnitAction
  | AttackCityAction
  | ResolveEventAction
  | BuildBuildingAction
  | UnqueueProductionAction
  | RushProductionAction
  | EstablishTradeRouteAction
  | ImproveTileAction
  | UpgradeUnitAction
  | DisbandUnitAction
  | RenameCityAction
  | BuildDistrictAction
  | RepairDistrictAction
  | GiftGoldAction
  | DeclareWarAction
  | ProposeAgreementAction
  | ResolveProposalAction
  | OfferTributeAction
  | DenounceAction
  | ProposeVassalageAction
  | ReleaseVassalAction
  | BefriendVillageAction
  | DemandTributeVillageAction
  | ConquerVillageAction
  | AbsorbVillageAction;

export interface VictoryStatus {
  winnerId: string | null;
  type: "domination" | "score" | "alliance" | null;
  reason: string | null;
  /** For an alliance victory (§6): the two co-winning civ ids. */
  allies?: string[];
}

export interface VisibilityResult {
  visibleTiles: string[];
  discoveredTiles: string[];
}

export interface CombatPreview {
  damageToDefender: number;
  damageToAttacker: number;
  attackerRemainingHp: number;
  defenderRemainingHp: number;
  /** Human-readable list of the combat modifiers that applied (for the UI). */
  modifiers: string[];
}

export interface CreateGameConfig {
  seed?: string;
  turnLimit?: number;
  difficulty?: Difficulty;
  humanPlayerId?: string | null;
  /** Allow a joint win by two long-standing Full Allies (§6; default on). */
  allianceVictory?: boolean;
  players?: Partial<Player>[];
  map?: {
    width?: number;
    height?: number;
    tiles?: Record<string, Partial<Tile>>;
    rivers?: Record<string, boolean>;
    regions?: string[];
    cities?: Record<
      string,
      Partial<City> & Pick<City, "id" | "ownerId" | "position" | "population">
    >;
    units?: Record<string, Partial<Unit> & Pick<Unit, "id" | "type" | "ownerId" | "position">>;
  };
}
