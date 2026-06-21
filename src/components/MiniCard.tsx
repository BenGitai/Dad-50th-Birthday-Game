import type { CardDef } from "../game/types";
import { cardMechanicLabels } from "../game/mechanicText";
import CardIcon from "./CardIcon";

interface MiniCardProps {
  card: CardDef;
  inDeck: boolean;
  onClick: () => void;
}

export default function MiniCard({ card, inDeck, onClick }: MiniCardProps) {
  const classes = ["mini-card", `rarity-${card.rarity}`, inDeck ? "in-deck" : ""].filter(Boolean).join(" ");
  const labels = cardMechanicLabels(card);
  return (
    <button type="button" className={classes} onClick={onClick}>
      <div className="mini-cost">{card.cost}</div>
      <CardIcon icon={card.icon} />
      <div className="mini-name">{card.name}</div>
      {card.type !== "spell" && (
        <div className="mini-stats">
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
      {labels.length > 0 && <div className="mini-tag">{labels.join(" · ")}</div>}
    </button>
  );
}
