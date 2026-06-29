import type { CardDef, PackDef, Rarity } from "../types";
import { CARDS } from "./cards";

export const PACKS: PackDef[] = [
  {
    id: "general",
    type: "general",
    name: "General Pack",
    icon: "🧫",
    description: "6 cards, any type",
    pickCost: 1,
    cardCount: 6,
  },
  {
    id: "microbe",
    type: "creature",
    name: "Microbe Pack",
    icon: "🦠",
    description: "6 creature cards",
    pickCost: 1,
    cardCount: 6,
  },
  {
    id: "spell",
    type: "spell",
    name: "Spell Pack",
    icon: "💊",
    description: "6 treatment cards",
    pickCost: 1,
    cardCount: 6,
  },
  {
    id: "legendary",
    type: "legendary",
    name: "Legendary Pack",
    icon: "🧬",
    description: "6 cards, high rare+ odds",
    pickCost: 2,
    cardCount: 6,
  },
];

const RARITY_WEIGHTS: Record<PackDef["type"], Partial<Record<Rarity, number>>> = {
  general: { common: 45, uncommon: 30, rare: 20, legendary: 5 },
  creature: { common: 45, uncommon: 30, rare: 20, legendary: 5 },
  spell: { common: 45, uncommon: 30, rare: 20, legendary: 5 },
  legendary: { common: 0, uncommon: 25, rare: 45, legendary: 30 },
};

function weightedRarity(packType: PackDef["type"]): Rarity {
  const weights = RARITY_WEIGHTS[packType];
  const entries = Object.entries(weights) as [Rarity, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of entries) {
    if (roll < weight) return rarity;
    roll -= weight;
  }
  return entries[entries.length - 1][0];
}

function poolForPack(pack: PackDef): CardDef[] {
  if (pack.type === "creature") return CARDS.filter((c) => c.type === "creature");
  if (pack.type === "spell") return CARDS.filter((c) => c.type === "spell");
  return CARDS;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Opens a single pack, returning `cardCount` card definitions (duplicates allowed). */
export function openPack(pack: PackDef): CardDef[] {
  const pool = poolForPack(pack);
  const result: CardDef[] = [];
  for (let i = 0; i < pack.cardCount; i++) {
    const rarity = weightedRarity(pack.type);
    const candidates = pool.filter((c) => c.rarity === rarity);
    result.push(candidates.length > 0 ? pickRandom(candidates) : pickRandom(pool));
  }

  // Legendary packs always guarantee at least one legendary.
  // Standard packs have a 50% chance of a guaranteed legendary.
  const guaranteeChance = pack.type === "legendary" ? 1.0 : 0.5;
  if (!result.some((c) => c.rarity === "legendary") && Math.random() < guaranteeChance) {
    const legendaryPool = pool.filter((c) => c.rarity === "legendary");
    const legendary = pickRandom(legendaryPool.length > 0 ? legendaryPool : CARDS.filter((c) => c.rarity === "legendary"));
    result[Math.floor(Math.random() * result.length)] = legendary;
  }

  return result;
}

export const MIN_DECK_SIZE = 8;
export const MAX_DECK_SIZE = 12;
export const TOTAL_PACK_PICKS = 3;

/** Builds a random deck (used for the AI opponent) from the full card pool. */
export function buildRandomDeck(size: number): string[] {
  return Array.from({ length: size }, () => pickRandom(CARDS).id);
}
