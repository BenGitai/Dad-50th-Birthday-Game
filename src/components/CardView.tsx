import type { CardDef } from "../game/types";
import CardIcon from "./CardIcon";

function effectText(card: Extract<CardDef, { type: "spell" }>): string {
  const e = card.effect;
  if (e.kind === "damage") return `Deal ${e.amount} dmg to ${e.target === "lane" ? "all enemies in a channel" : "the front enemy"}`;
  if (e.kind === "heal") return `Heal ${e.amount} hp to ${e.target === "lane" ? "your channel" : "your front unit"}`;
  if (e.kind === "buff") return `+${e.amount} ${e.stat} to your channel for ${e.durationSeconds}s`;
  return `Slow enemies in the channel for ${e.durationSeconds}s`;
}

interface CardViewProps {
  card: CardDef;
  selected?: boolean;
  affordable?: boolean;
  onClick?: () => void;
}

export default function CardView({ card, selected, affordable = true, onClick }: CardViewProps) {
  const classes = [
    "card",
    `rarity-${card.rarity}`,
    selected ? "selected" : "",
    !affordable ? "unaffordable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classes} onClick={onClick}>
      <div className="card-cost">{card.cost}</div>
      <div className="card-type-tag">{card.type === "creature" ? "Microbe" : card.type === "spell" ? "Spell" : "Structure"}</div>
      <div className="card-art">
        <CardIcon icon={card.icon} />
      </div>
      <div className="card-name">{card.name}</div>
      {card.type === "spell" ? (
        <div className="card-effect">{effectText(card)}</div>
      ) : (
        <div className="card-stats">
          <span className="stat-atk-c">{"attack" in card.stats ? card.stats.attack : 0}</span>
          <span className="stat-hp-c">{card.stats.health}</span>
        </div>
      )}
    </button>
  );
}
