import { CARD_BY_ID } from "../data/cards";
import { LANE_COUNT } from "./engine";
import type { GameEngine } from "./engine";

/** Very simple enemy AI: play a random affordable card into a random lane. */
export function runEnemyAI(engine: GameEngine) {
  const enemy = engine.state.enemy;
  const playable = enemy.hand.filter((cardId) => {
    const card = CARD_BY_ID[cardId];
    return card && card.cost <= enemy.nutrients;
  });
  if (playable.length === 0) return;

  const cardId = playable[Math.floor(Math.random() * playable.length)];
  const lane = Math.floor(Math.random() * LANE_COUNT);
  engine.playCard("enemy", cardId, lane);
}
