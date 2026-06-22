import type { CardDef } from "../game/types";
import { cardMechanicTexts, spellEffectText } from "../game/mechanicText";
import CardIcon from "./CardIcon";

interface CardViewProps {
  card: CardDef;
  selected?: boolean;
  affordable?: boolean;
  large?: boolean;
  onClick?: () => void;
}

export default function CardView({ card, selected, affordable = true, large, onClick }: CardViewProps) {
  const classes = [
    "card",
    `rarity-${card.rarity}`,
    selected ? "selected" : "",
    !affordable ? "unaffordable" : "",
    large ? "card-large" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const mechanicTexts = cardMechanicTexts(card);

  return (
    <button type="button" className={classes} onClick={onClick}>
      <div className="card-cost">{card.cost}</div>
      <div className="card-type-tag">{card.type === "creature" ? "Microbe" : card.type === "spell" ? "Spell" : "Structure"}</div>
      <div className="card-art">
        <CardIcon icon={card.icon} />
      </div>
      <div className="card-name">{card.name}</div>
      {card.type !== "spell" && (
        <div className="card-stats">
          <div className="stat-block">
            <span className="stat-icon-num stat-atk-c">⚔ {"attack" in card.stats ? card.stats.attack : 0}</span>
            <span className="stat-label">ATK</span>
          </div>
          <div className="stat-block">
            <span className="stat-icon-num stat-hp-c">♥ {card.stats.health}</span>
            <span className="stat-label">HP</span>
          </div>
        </div>
      )}
      {card.type === "spell" ? (
        <div className="card-effect">{spellEffectText(card)}</div>
      ) : mechanicTexts.length > 0 ? (
        <div className="card-effect">{mechanicTexts.join(" ")}</div>
      ) : (
        <div className="card-effect card-effect-flavor">{card.flavor}</div>
      )}
    </button>
  );
}
