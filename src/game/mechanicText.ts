import type { CardDef, MechanicConfig } from "./types";

/** Full plain-English explanation of a mechanic, shown on cards in hand. */
export function mechanicText(config: MechanicConfig): string {
  switch (config.kind) {
    case "swarm":
      return `Deploys ${config.count} copies at once.`;
    case "replicate":
      return `Splits off a weaker copy every ${config.intervalSeconds}s (up to ${config.maxCopies}).`;
    case "tank":
      return "Taunt: enemies in this channel attack it before anything else.";
    case "laneJump":
      return config.trigger === "blocked"
        ? "Shifts to an open channel when its path is blocked."
        : `Shifts to a random channel every ${config.intervalSeconds ?? 5}s.`;
    case "spawner":
      return `Spawns a new unit every ${config.intervalSeconds}s.`;
    case "aura":
      return config.perAlly
        ? `Allies here get +${config.buff.amount} ${config.buff.stat} per ally in the channel.`
        : `Allies in this channel get +${config.buff.amount} ${config.buff.stat}.`;
    case "burstOnDeath":
      return `On death, deals ${config.damage} dmg to all enemies in the channel.`;
    case "shield":
      return `Absorbs the first ${config.absorb} damage it takes.`;
    case "dormant":
      return `Invulnerable for ${config.durationSeconds}s, then hatches into a stronger form.`;
    case "stealBuff":
      return "On deploy, copies a buff from its nearest ally.";
  }
}

/** Short tag for compact card displays (mini cards, pack pool). */
export function mechanicLabel(config: MechanicConfig): string {
  switch (config.kind) {
    case "swarm":
      return `Swarm x${config.count}`;
    case "replicate":
      return "Replicates";
    case "tank":
      return "Tank";
    case "laneJump":
      return "Lane Jump";
    case "spawner":
      return "Spawner";
    case "aura":
      return "Aura";
    case "burstOnDeath":
      return "Burst on Death";
    case "shield":
      return `Shield ${config.absorb}`;
    case "dormant":
      return "Dormant";
    case "stealBuff":
      return "Steals Buff";
  }
}

export function cardMechanicTexts(card: CardDef): string[] {
  if (card.type === "spell") return [];
  return card.mechanics.map(mechanicText);
}

export function cardMechanicLabels(card: CardDef): string[] {
  if (card.type === "spell") return [];
  return card.mechanics.map(mechanicLabel);
}
