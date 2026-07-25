// Type surface for the declarative cards data (implementation in cards-data-v2.js).
// Design of record: HEGEMON-CIVS-CARDS-v2.md. Only the shapes the TS callers rely on are
// declared; the data file itself is the source of truth for the values.
export const RARITY: string[];

export interface CivCard { id: string; name: string; rarity: string; playable?: boolean; wave?: number; [k: string]: unknown; }
export const CIV_CARDS: CivCard[];

export interface Legend { id: string; civ: string | null; role: string; rarity: string; name: string; effect: Record<string, unknown>; blurb?: string; [k: string]: unknown; }
export const LEGENDS: Legend[];

export interface Edict { id: string; civ?: string | null; rarity: string; name: string; effect: Record<string, unknown>; [k: string]: unknown; }
export const EDICTS: Edict[];

export interface EventCard {
  id: string;
  name: string;
  rarity: string;
  civ: string | null;
  effect: { instant: string; [k: string]: unknown };
  requiresTech?: string;
  flavor?: string;   // History Deck cards carry evocative flavour + a historical codex entry
  codex?: string;
}
export const EVENT_CARDS: EventCard[];

export const PACK_ECONOMY: Record<string, unknown>;
