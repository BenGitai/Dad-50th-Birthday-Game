import { CARD_BY_ID, CARDS } from "../data/cards";
import { LANE_COUNT } from "./engine";
import type { GameEngine } from "./engine";

/** How threatening is the player's presence in a lane (for the enemy AI). */
function lanePlayerThreat(engine: GameEngine, laneIndex: number): number {
  let threat = 0;
  for (const u of engine.state.lanes[laneIndex]) {
    if (u.owner === "player" && u.currentHp > 0) {
      // Progress toward enemy base drives threat; attack weight makes big units scarier
      threat += (u.baseStats.attack + 1) * (0.3 + u.progress * 2);
    }
  }
  return threat;
}

/** How much enemy presence is already in a lane (for reinforcement decisions). */
function laneEnemyStrength(engine: GameEngine, laneIndex: number): number {
  let strength = 0;
  for (const u of engine.state.lanes[laneIndex]) {
    if (u.owner === "enemy" && u.currentHp > 0) {
      strength += u.currentHp;
    }
  }
  return strength;
}

/**
 * Smarter enemy AI:
 * - Prefers playing the highest-cost affordable card (curves out nutrients efficiently).
 * - Creatures go into the most threatened lane 60% of the time, reinforce own lanes 25%, random 15%.
 * - Spells always target the most threatened lane, with a small random chance.
 */
export function runEnemyAI(engine: GameEngine) {
  const enemy = engine.state.enemy;
  const playable = enemy.hand.filter((cardId) => {
    const card = CARD_BY_ID[cardId];
    return card && card.cost <= enemy.nutrients;
  });
  if (playable.length === 0) return;

  // Prefer the most expensive affordable card to use nutrients efficiently
  const sortedByValue = [...playable].sort((a, b) => {
    const ca = CARD_BY_ID[a];
    const cb = CARD_BY_ID[b];
    return (cb?.cost ?? 0) - (ca?.cost ?? 0);
  });
  const cardId = Math.random() < 0.7 ? sortedByValue[0] : playable[Math.floor(Math.random() * playable.length)];
  const card = CARD_BY_ID[cardId];

  // Lane scores
  const threats = Array.from({ length: LANE_COUNT }, (_, i) => ({ i, t: lanePlayerThreat(engine, i) }));
  const strengths = Array.from({ length: LANE_COUNT }, (_, i) => ({ i, s: laneEnemyStrength(engine, i) }));
  threats.sort((a, b) => b.t - a.t);
  strengths.sort((a, b) => b.s - a.s);

  let lane: number;
  if (card?.type === "spell") {
    // Spells: target most-threatened lane or random
    lane = Math.random() < 0.8 ? threats[0].i : Math.floor(Math.random() * LANE_COUNT);
  } else {
    const roll = Math.random();
    if (roll < 0.60) {
      // Counter: play into the lane where player is strongest
      lane = threats[0].i;
    } else if (roll < 0.85) {
      // Reinforce: pile into a lane where enemy already has units
      const withUnits = strengths.filter((l) => l.s > 0);
      lane = withUnits.length > 0
        ? withUnits[Math.floor(Math.random() * withUnits.length)].i
        : Math.floor(Math.random() * LANE_COUNT);
    } else {
      lane = Math.floor(Math.random() * LANE_COUNT);
    }
  }

  engine.playCard("enemy", cardId, lane);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Builds a deck with a sensible cost curve so the AI always has plays at every stage. */
export function buildCurvedDeck(size: number): string[] {
  const cheap = CARDS.filter((c) => c.cost <= 2);
  const mid = CARDS.filter((c) => c.cost >= 3 && c.cost <= 4);
  const expensive = CARDS.filter((c) => c.cost >= 5);

  const cheapCount = Math.round(size * 0.30);
  const expensiveCount = Math.round(size * 0.25);
  const midCount = size - cheapCount - expensiveCount;

  const result: string[] = [];
  for (let i = 0; i < cheapCount; i++) result.push(pickRandom(cheap).id);
  for (let i = 0; i < midCount; i++) result.push(pickRandom(mid).id);
  for (let i = 0; i < expensiveCount; i++) result.push(pickRandom(expensive).id);
  return result;
}
