export type TerrainType =
  | "plains"
  | "valley"
  | "forest"
  | "hills"
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
}

export interface TechRule {
  age: 1 | 2 | 3;
  prerequisites: string[];
  forkGroup?: string;
  forkBranch?: string;
  /** Civ id (lowercase, e.g. "rome") this tech is unique to — only that people may research it. */
  civ?: string;
  /** Explicit science cost; when omitted the cost is derived from the age. */
  cost?: number;
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
  perks?: { food?: number; production?: number; gold?: number; science?: number; stability?: number };
}

export interface GameMap {
  width: number;
  height: number;
  tiles: Record<string, Tile>;
  rivers: Record<string, boolean>;
  regions: string[];
  cities: Record<string, City>;
  units: Record<string, Unit>;
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
  | RenameCityAction;

export interface VictoryStatus {
  winnerId: string | null;
  type: "domination" | "score" | null;
  reason: string | null;
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
