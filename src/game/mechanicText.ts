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
    case "regenerate":
      return `Regenerates ${config.hpPerSec} HP per second.`;
    case "leech":
      return `Heals for ${Math.round(config.fraction * 100)}% of damage dealt.`;
    case "berserk":
      return `Below 50% HP: gains +${config.bonusAttack} attack.`;
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
    case "regenerate":
      return `Regen ${config.hpPerSec}/s`;
    case "leech":
      return `Leech ${Math.round(config.fraction * 100)}%`;
    case "berserk":
      return `Berserk +${config.bonusAttack}`;
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

/** Full plain-English explanation of a spell card's effect. */
export function spellEffectText(card: Extract<CardDef, { type: "spell" }>): string {
  const e = card.effect;
  if (e.kind === "damage") return `Deal ${e.amount} dmg to ${e.target === "lane" ? "all enemies in a channel" : "the front enemy"}`;
  if (e.kind === "heal") return `Heal ${e.amount} hp to ${e.target === "lane" ? "your channel" : "your front unit"}`;
  if (e.kind === "buff") return `+${e.amount} ${e.stat} to your channel for ${e.durationSeconds}s`;
  return `Slow enemies in the channel for ${e.durationSeconds}s`;
}

/** Full rules text for any card — spell effect or creature/structure mechanics. */
export function cardRulesText(card: CardDef): string {
  if (card.type === "spell") return spellEffectText(card);
  return cardMechanicTexts(card).join(" ");
}
