import { CARD_BY_ID } from "../data/cards";
import type {
  CreatureCardDef,
  GameState,
  Owner,
  PlayerState,
  SpellEffect,
  StructureCardDef,
  UnitInstance,
  UnitStats,
} from "../types";
import { instantiateUnits } from "./createUnit";

export const LANE_COUNT = 3;
export const ATTACK_INTERVAL = 1; // seconds between hits
export const MELEE_GAP = 0.018; // lane-progress distance counted as "touching"
export const NUTRIENT_REGEN_BASE = 0.5;  // starting regen rate
export const NUTRIENT_RAMP_INTERVAL = 20; // seconds between ramp steps
export const NUTRIENT_RAMP_AMOUNT = 0.12; // added per ramp step
export const NUTRIENT_REGEN_MAX = 1.4;    // regen cap (~2min in)
export const STARTING_NUTRIENTS = 4;
export const MAX_NUTRIENTS = 10;
export const STARTING_BASE_HP = 30;
export const HAND_SIZE = 4;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makePlayerState(deck: string[]): PlayerState {
  const shuffled = shuffle(deck);
  return {
    baseHp: STARTING_BASE_HP,
    maxBaseHp: STARTING_BASE_HP,
    nutrients: STARTING_NUTRIENTS,
    maxNutrients: MAX_NUTRIENTS,
    deck: shuffled,
    hand: shuffled.slice(0, HAND_SIZE),
    drawPile: shuffled.slice(HAND_SIZE),
  };
}

export function createInitialState(playerDeck: string[], enemyDeck: string[]): GameState {
  return {
    status: "playing",
    elapsedSeconds: 0,
    lanes: Array.from({ length: LANE_COUNT }, () => []),
    player: makePlayerState(playerDeck),
    enemy: makePlayerState(enemyDeck),
  };
}

/** Position on a shared 0..1 lane axis: 0 = player base, 1 = enemy base. */
function sharedPos(unit: UnitInstance): number {
  return unit.owner === "player" ? unit.progress : 1 - unit.progress;
}

function isDormant(unit: UnitInstance): boolean {
  const ms = unit.mechanicStates.find((m) => m.config.kind === "dormant");
  return !!ms && (ms.dormantRemaining ?? Infinity) > 0;
}

/** Computes a unit's live stats: base + temporary buffs + lane auras from allies. */
function effectiveStats(unit: UnitInstance, laneUnits: UnitInstance[]): UnitStats {
  const stats: UnitStats = { ...unit.baseStats };

  for (const buff of unit.activeBuffs) {
    stats[buff.stat] += buff.amount;
  }

  const allyCount = laneUnits.filter((u) => u.owner === unit.owner && u.currentHp > 0).length;
  for (const ally of laneUnits) {
    if (ally.owner !== unit.owner || ally.instanceId === unit.instanceId || ally.currentHp <= 0) continue;
    for (const ms of ally.mechanicStates) {
      if (ms.config.kind !== "aura") continue;
      const factor = ms.config.perAlly ? allyCount : 1;
      stats[ms.config.buff.stat] += ms.config.buff.amount * factor;
    }
  }

  return stats;
}

export class GameEngine {
  state: GameState;

  constructor(playerDeck: string[], enemyDeck: string[]) {
    this.state = createInitialState(playerDeck, enemyDeck);
  }

  playCard(owner: Owner, cardId: string, lane: number): boolean {
    if (this.state.status !== "playing") return false;
    const player = this.state[owner];
    const card = CARD_BY_ID[cardId];
    if (!card || player.nutrients < card.cost) return false;
    if (!player.hand.includes(cardId)) return false;

    if (card.type === "spell") {
      this.castSpell(owner, lane, card.effect);
    } else {
      const units = instantiateUnits(card as CreatureCardDef | StructureCardDef, owner, lane);
      this.state.lanes[lane].push(...units);
    }

    player.nutrients -= card.cost;
    const handIdx = player.hand.indexOf(cardId);
    player.hand.splice(handIdx, 1);
    const next = player.drawPile.shift();
    if (next) {
      player.hand.push(next);
    } else {
      player.drawPile = shuffle(player.deck);
      const reshuffled = player.drawPile.shift();
      if (reshuffled) player.hand.push(reshuffled);
    }
    return true;
  }

  private castSpell(owner: Owner, lane: number, effect: SpellEffect) {
    const enemyOwner: Owner = owner === "player" ? "enemy" : "player";
    const laneUnits = this.state.lanes[lane];

    if (effect.kind === "damage") {
      const targets =
        effect.target === "lane"
          ? laneUnits.filter((u) => u.owner === enemyOwner && u.currentHp > 0)
          : frontUnit(laneUnits, enemyOwner) ? [frontUnit(laneUnits, enemyOwner)!] : [];
      for (const t of targets) this.applyDamage(t, effect.amount);
    } else if (effect.kind === "heal") {
      const targets =
        effect.target === "lane"
          ? laneUnits.filter((u) => u.owner === owner && u.currentHp > 0)
          : frontUnit(laneUnits, owner) ? [frontUnit(laneUnits, owner)!] : [];
      for (const t of targets) {
        const max = effectiveStats(t, laneUnits).health;
        t.currentHp = Math.min(max, t.currentHp + effect.amount);
      }
    } else if (effect.kind === "buff") {
      const targets = laneUnits.filter((u) => u.owner === owner && u.currentHp > 0);
      for (const t of targets) {
        t.activeBuffs.push({ stat: effect.stat, amount: effect.amount, remainingSeconds: effect.durationSeconds });
      }
    } else if (effect.kind === "slow") {
      const targets = laneUnits.filter((u) => u.owner === enemyOwner && u.currentHp > 0);
      for (const t of targets) {
        t.activeBuffs.push({
          stat: "speed",
          amount: -effect.amount * t.baseStats.speed,
          remainingSeconds: effect.durationSeconds,
        });
      }
    }
  }

  private applyDamage(unit: UnitInstance, amount: number) {
    let remaining = amount;
    const shield = unit.mechanicStates.find((m) => m.config.kind === "shield");
    if (shield && shield.config.kind === "shield") {
      if (shield.shieldRemaining === undefined) shield.shieldRemaining = shield.config.absorb;
      const absorbed = Math.min(shield.shieldRemaining, remaining);
      shield.shieldRemaining -= absorbed;
      remaining -= absorbed;
    }
    unit.currentHp -= remaining;
  }

  tick(dt: number) {
    if (this.state.status !== "playing") return;
    this.state.elapsedSeconds += dt;

    this.regenNutrients(dt);
    for (let lane = 0; lane < this.state.lanes.length; lane++) {
      this.tickLane(lane, dt);
    }
    this.checkWinCondition();
  }

  private regenNutrients(dt: number) {
    const rampSteps = Math.floor(this.state.elapsedSeconds / NUTRIENT_RAMP_INTERVAL);
    const rate = Math.min(NUTRIENT_REGEN_MAX, NUTRIENT_REGEN_BASE + rampSteps * NUTRIENT_RAMP_AMOUNT);
    for (const owner of ["player", "enemy"] as Owner[]) {
      const p = this.state[owner];
      p.nutrients = Math.min(p.maxNutrients, p.nutrients + rate * dt);
    }
  }

  private tickLane(laneIndex: number, dt: number) {
    const laneUnits = this.state.lanes[laneIndex];

    this.tickBuffsAndDormancy(laneUnits, dt);

    const activeUnits = laneUnits.filter((u) => u.currentHp > 0 && !isDormant(u));
    const playerUnits = activeUnits
      .filter((u) => u.owner === "player")
      .sort((a, b) => sharedPos(b) - sharedPos(a));
    const enemyUnits = activeUnits
      .filter((u) => u.owner === "enemy")
      .sort((a, b) => sharedPos(a) - sharedPos(b));

    const playerFront = playerUnits[0];
    const enemyFront = enemyUnits[0];

    if (playerFront && enemyFront) {
      const gap = sharedPos(enemyFront) - sharedPos(playerFront);
      const pStats = effectiveStats(playerFront, laneUnits);
      const eStats = effectiveStats(enemyFront, laneUnits);

      if (gap <= Math.max(pStats.range, MELEE_GAP)) {
        const defender = this.taunter(enemyUnits) ?? enemyFront;
        this.resolveAttack(playerFront, defender, dt, laneUnits);
      }
      if (gap <= Math.max(eStats.range, MELEE_GAP)) {
        const defender = this.taunter(playerUnits) ?? playerFront;
        this.resolveAttack(enemyFront, defender, dt, laneUnits);
      }
    }

    for (const u of laneUnits) {
      if (u.currentHp > 0 && !isDormant(u)) this.tickMechanics(u, laneIndex, dt);
    }

    // Each unit advances independently, only stopping for the nearest enemy
    // ahead of it — same-owner units (including stationary structures) never
    // block each other's movement.
    this.advance(playerUnits, enemyUnits, laneUnits, dt);
    this.advance(enemyUnits, playerUnits, laneUnits, dt);

    this.cleanupDeaths(laneIndex);
  }

  private tickBuffsAndDormancy(laneUnits: UnitInstance[], dt: number) {
    for (const u of laneUnits) {
      u.activeBuffs = u.activeBuffs
        .map((b) => ({ ...b, remainingSeconds: b.remainingSeconds - dt }))
        .filter((b) => b.remainingSeconds > 0);

      const dormant = u.mechanicStates.find((m) => m.config.kind === "dormant");
      if (dormant && dormant.config.kind === "dormant") {
        if (dormant.dormantRemaining === undefined) dormant.dormantRemaining = dormant.config.durationSeconds;
        if (dormant.dormantRemaining > 0) {
          dormant.dormantRemaining -= dt;
          if (dormant.dormantRemaining <= 0) {
            u.baseStats = { ...u.baseStats, ...dormant.config.hatchStats };
            if (dormant.config.hatchStats.health) u.currentHp = dormant.config.hatchStats.health;
            u.mechanicStates = u.mechanicStates.filter((m) => m !== dormant);
          }
        }
      }
    }
  }

  /** Returns the frontmost alive unit on the given side that has the `tank` mechanic. */
  private taunter(sortedUnits: UnitInstance[]): UnitInstance | undefined {
    return sortedUnits.find((u) => u.mechanicStates.some((m) => m.config.kind === "tank"));
  }

  private resolveAttack(attacker: UnitInstance, defender: UnitInstance, dt: number, laneUnits: UnitInstance[]) {
    attacker.attackCooldown -= dt;
    if (attacker.attackCooldown > 0) return;
    const eff = effectiveStats(attacker, laneUnits);
    this.applyDamage(defender, eff.attack);
    attacker.attackCooldown = ATTACK_INTERVAL;
  }

  private tickMechanics(u: UnitInstance, laneIndex: number, dt: number) {
    for (const ms of u.mechanicStates) {
      if (ms.config.kind === "replicate") {
        ms.cooldown += dt;
        const spawned = ms.copiesSpawned ?? 0;
        if (ms.cooldown >= ms.config.intervalSeconds && spawned < ms.config.maxCopies) {
          ms.cooldown = 0;
          ms.copiesSpawned = spawned + 1;
          const card = CARD_BY_ID[u.cardId] as CreatureCardDef;
          const child = instantiateUnits(card, u.owner, laneIndex)[0];
          const childHealth = Math.max(1, Math.round(u.baseStats.health * ms.config.hpFraction));
          child.progress = u.progress;
          child.baseStats = { ...u.baseStats, health: childHealth };
          child.currentHp = childHealth;
          const childReplicate = child.mechanicStates.find((m) => m.config.kind === "replicate");
          if (childReplicate) childReplicate.copiesSpawned = ms.copiesSpawned;
          this.state.lanes[laneIndex].push(child);
        }
      } else if (ms.config.kind === "spawner") {
        ms.cooldown += dt;
        if (ms.cooldown >= ms.config.intervalSeconds) {
          ms.cooldown = 0;
          const card = CARD_BY_ID[ms.config.spawnCardId];
          if (card && card.type !== "spell") {
            this.state.lanes[laneIndex].push(...instantiateUnits(card, u.owner, laneIndex));
          }
        }
      } else if (ms.config.kind === "laneJump") {
        this.tickLaneJump(u, ms, laneIndex, dt);
      }
    }
  }

  private tickLaneJump(
    u: UnitInstance,
    ms: UnitInstance["mechanicStates"][number],
    laneIndex: number,
    dt: number,
  ) {
    if (ms.config.kind !== "laneJump") return;
    const blocked = this.isBlocked(u, laneIndex);

    if (ms.config.trigger === "blocked") {
      if (!blocked) {
        ms.cooldown = 0;
        return;
      }
      ms.cooldown += dt;
      if (ms.cooldown < 1) return;
    } else {
      ms.cooldown += dt;
      if (ms.cooldown < (ms.config.intervalSeconds ?? 5)) return;
    }
    ms.cooldown = 0;

    const dir = Math.random() < 0.5 ? -1 : 1;
    let target = u.lane + dir;
    if (target < 0 || target >= LANE_COUNT) target = u.lane - dir;
    if (target < 0 || target >= LANE_COUNT || target === u.lane) return;

    const currentArr = this.state.lanes[u.lane];
    const idx = currentArr.indexOf(u);
    if (idx >= 0) currentArr.splice(idx, 1);
    u.lane = target;
    this.state.lanes[target].push(u);
  }

  private isBlocked(u: UnitInstance, laneIndex: number): boolean {
    const laneUnits = this.state.lanes[laneIndex].filter((x) => x.currentHp > 0 && !isDormant(x));
    const opponents = laneUnits.filter((x) => x.owner !== u.owner);
    if (opponents.length === 0) return false;
    const gap = this.nearestEnemyGap(u, opponents);
    return gap !== null && gap <= MELEE_GAP * 4;
  }

  /** Gap to the nearest still-ahead opposing unit, or null if the lane ahead is clear. */
  private nearestEnemyGap(u: UnitInstance, opposing: UnitInstance[]): number | null {
    const myPos = sharedPos(u);
    let nearest: number | null = null;
    for (const o of opposing) {
      const oPos = sharedPos(o);
      const gap = u.owner === "player" ? oPos - myPos : myPos - oPos;
      if (gap < 0) continue; // already passed this unit
      if (nearest === null || gap < nearest) nearest = gap;
    }
    return nearest;
  }

  private advance(units: UnitInstance[], opposing: UnitInstance[], laneUnits: UnitInstance[], dt: number) {
    const scored: UnitInstance[] = [];

    for (const u of units) {
      if (u.isStructure) continue;

      const eff = effectiveStats(u, laneUnits);
      const gap = this.nearestEnemyGap(u, opposing);
      const blocked = gap !== null && gap <= Math.max(eff.range, MELEE_GAP);
      if (!blocked) {
        const speed = Math.max(0, eff.speed);
        u.progress = Math.min(1, u.progress + speed * dt);
        if (u.progress >= 1) scored.push(u);
      }
    }

    for (const u of scored) {
      const eff = effectiveStats(u, laneUnits);
      const targetState = u.owner === "player" ? this.state.enemy : this.state.player;
      targetState.baseHp = Math.max(0, targetState.baseHp - eff.attack);
      u.currentHp = 0; // unit "spends itself" hitting the base
    }
  }

  private cleanupDeaths(laneIndex: number) {
    const laneArr = this.state.lanes[laneIndex];
    const dead = laneArr.filter((u) => u.currentHp <= 0);
    for (const d of dead) {
      const burst = d.mechanicStates.find((m) => m.config.kind === "burstOnDeath");
      if (burst && burst.config.kind === "burstOnDeath") {
        const targets = laneArr.filter((u) => u.owner !== d.owner && u.currentHp > 0);
        for (const t of targets) this.applyDamage(t, burst.config.damage);
      }
    }
    this.state.lanes[laneIndex] = laneArr.filter((u) => u.currentHp > 0);
  }

  private checkWinCondition() {
    if (this.state.player.baseHp <= 0) this.state.status = "lost";
    else if (this.state.enemy.baseHp <= 0) this.state.status = "won";
  }
}

function frontUnit(laneUnits: UnitInstance[], owner: Owner): UnitInstance | undefined {
  const candidates = laneUnits.filter((u) => u.owner === owner && u.currentHp > 0);
  if (candidates.length === 0) return undefined;
  return candidates.sort((a, b) => sharedPos(b) - sharedPos(a))[owner === "player" ? 0 : candidates.length - 1];
}
