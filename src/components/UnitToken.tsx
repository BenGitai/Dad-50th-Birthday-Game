import { CARD_BY_ID } from "../game/data/cards";
import type { UnitInstance } from "../game/types";
import CardIcon from "./CardIcon";

function isDormant(unit: UnitInstance): boolean {
  const ms = unit.mechanicStates.find((m) => m.config.kind === "dormant");
  return !!ms && (ms.dormantRemaining ?? Infinity) > 0;
}

/** Position on a shared 0..1 axis: 0 = player base, 1 = enemy base. */
function sharedPos(unit: UnitInstance): number {
  return unit.owner === "player" ? unit.progress : 1 - unit.progress;
}

export default function UnitToken({ unit }: { unit: UnitInstance }) {
  const card = CARD_BY_ID[unit.cardId];
  if (!card) return null;
  const dormant = isDormant(unit);
  // top% : enemy base sits visually at the top of the lane, player base at the bottom
  const topPercent = (1 - sharedPos(unit)) * 100;

  return (
    <div
      className={`unit-wrap ${unit.owner === "player" ? "ally" : "enemy"}`}
      style={{ top: `${topPercent}%` }}
    >
      <div className="trail" />
      <div className={`unit ${unit.owner === "player" ? "ally" : "enemy"} ${dormant ? "dormant" : ""} ${unit.isStructure ? "structure" : ""}`}>
        <CardIcon icon={card.icon} />
        {!unit.isStructure && (
          <div className="unit-stat">
            <span className="stat-atk">{Math.round(unit.baseStats.attack)}</span>
            <span className="stat-hp">{Math.max(0, Math.ceil(unit.currentHp))}</span>
          </div>
        )}
      </div>
    </div>
  );
}
