import type { CreatureCardDef, Owner, StructureCardDef, UnitInstance, UnitStats } from "../types";

let counter = 0;
function makeInstanceId(): string {
  counter += 1;
  return `u${counter}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Instantiates the live units a creature/structure card produces (>1 for swarm cards). */
export function instantiateUnits(
  card: CreatureCardDef | StructureCardDef,
  owner: Owner,
  lane: number,
): UnitInstance[] {
  const swarmMechanic = card.mechanics.find((m) => m.kind === "swarm");
  const count = swarmMechanic && swarmMechanic.kind === "swarm" ? swarmMechanic.count : 1;

  const stats: UnitStats =
    card.type === "creature"
      ? card.stats
      : { attack: 0, health: card.stats.health, speed: 0, range: 0 };

  return Array.from({ length: count }, () => ({
    instanceId: makeInstanceId(),
    cardId: card.id,
    owner,
    lane,
    progress: 0,
    currentHp: stats.health,
    baseStats: stats,
    mechanicStates: card.mechanics.map((m) => ({ config: m, cooldown: 0 })),
    isStructure: card.type === "structure",
    attackCooldown: 0,
    activeBuffs: [],
  }));
}
