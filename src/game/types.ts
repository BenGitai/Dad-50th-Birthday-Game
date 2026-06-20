// Core data types for cards, mechanics, and live game state.
// Mechanics are modeled as data (MechanicConfig) so new abilities can be
// added by writing card data, without touching the simulation engine for
// every new combination.

export type Rarity = "common" | "rare" | "epic" | "legendary";

export type CardType = "creature" | "spell" | "structure";

export type PackType = "general" | "creature" | "spell" | "legendary";

export type Owner = "player" | "enemy";

export interface UnitStats {
  attack: number;
  health: number;
  /** lane progress per second, where 1.0 = full lane length */
  speed: number;
  /** 0 = melee/contact only, >0 = attacks from N lane-progress units away */
  range: number;
}

export type StatKey = "attack" | "health" | "speed" | "range";

export interface StatBuff {
  stat: StatKey;
  amount: number;
}

export type MechanicConfig =
  /** Card deploys `count` copies of the unit instead of one. */
  | { kind: "swarm"; count: number }
  /** Binary fission: spawns a weaker copy of itself periodically. */
  | { kind: "replicate"; intervalSeconds: number; hpFraction: number; maxCopies: number }
  /** High priority blocker; enemies in the lane must fight it before passing. */
  | { kind: "tank" }
  /** Shifts to an adjacent lane when its path forward is blocked. */
  | { kind: "laneJump"; trigger: "blocked" | "periodic"; intervalSeconds?: number }
  /** Structure-only: periodically spawns a unit into its own lane. */
  | { kind: "spawner"; intervalSeconds: number; spawnCardId: string }
  /** Buffs allies in the same lane; strengthens with more nearby allies. */
  | { kind: "aura"; buff: StatBuff; perAlly: boolean }
  /** Deals splash damage to the lane when this unit dies. */
  | { kind: "burstOnDeath"; damage: number }
  /** Absorbs the next hit(s) of damage. */
  | { kind: "shield"; absorb: number }
  /** Invulnerable for a duration, then becomes a stronger form. */
  | { kind: "dormant"; durationSeconds: number; hatchStats: Partial<UnitStats> }
  /** Copies one buff/mechanic from the nearest ally on play. */
  | { kind: "stealBuff" };

export type MechanicKind = MechanicConfig["kind"];

export type SpellEffect =
  | { kind: "damage"; amount: number; target: "lane" | "frontUnit" }
  | { kind: "heal"; amount: number; target: "lane" | "frontUnit" }
  | { kind: "buff"; stat: StatKey; amount: number; durationSeconds: number; target: "lane" }
  | { kind: "slow"; amount: number; durationSeconds: number; target: "lane" };

interface BaseCardDef {
  id: string;
  name: string;
  rarity: Rarity;
  cost: number;
  icon: string;
  flavor: string;
}

export interface CreatureCardDef extends BaseCardDef {
  type: "creature";
  stats: UnitStats;
  mechanics: MechanicConfig[];
}

export interface StructureCardDef extends BaseCardDef {
  type: "structure";
  stats: Pick<UnitStats, "health">;
  mechanics: MechanicConfig[];
}

export interface SpellCardDef extends BaseCardDef {
  type: "spell";
  effect: SpellEffect;
}

export type CardDef = CreatureCardDef | StructureCardDef | SpellCardDef;

export interface PackDef {
  id: string;
  type: PackType;
  name: string;
  icon: string;
  description: string;
  /** how many of the 3 pack picks this consumes (legendary pack costs 2) */
  pickCost: number;
  cardCount: number;
}

// ---------- Live simulation state ----------

export interface UnitMechanicState {
  config: MechanicConfig;
  /** seconds since this mechanic last triggered (replicate/spawner/laneJump-periodic) */
  cooldown: number;
  /** for replicate: how many copies have been spawned so far */
  copiesSpawned?: number;
  /** for shield: remaining absorb */
  shieldRemaining?: number;
  /** for dormant: remaining seconds before hatching */
  dormantRemaining?: number;
}

export interface ActiveBuff {
  stat: StatKey;
  amount: number;
  remainingSeconds: number;
}

export interface UnitInstance {
  instanceId: string;
  cardId: string;
  owner: Owner;
  lane: number;
  /** 0 = at owner's base edge, 1 = at opponent's base edge */
  progress: number;
  currentHp: number;
  baseStats: UnitStats;
  mechanicStates: UnitMechanicState[];
  isStructure: boolean;
  /** seconds remaining until this unit can attack again */
  attackCooldown: number;
  /** temporary stat modifiers from spells, with their own expiry */
  activeBuffs: ActiveBuff[];
}

export interface PlayerState {
  baseHp: number;
  maxBaseHp: number;
  nutrients: number;
  maxNutrients: number;
  deck: string[];
  hand: string[];
  drawPile: string[];
}

export type LaneEntities = UnitInstance[];

export interface GameState {
  status: "playing" | "won" | "lost";
  elapsedSeconds: number;
  lanes: LaneEntities[]; // length 3, units from both owners share the array
  player: PlayerState;
  enemy: PlayerState;
}
