import { CARD_BY_ID } from "../game/data/cards";
import type { PlayerState } from "../game/types";
import CardView from "./CardView";

const MAX_NUTRIENT_PIPS = 10;

interface HandProps {
  player: PlayerState;
  selectedCardId: string | null;
  onSelect: (cardId: string) => void;
}

export default function Hand({ player, selectedCardId, onSelect }: HandProps) {
  return (
    <>
      <div className="controls">
        <div className="mana-track">
          {Array.from({ length: MAX_NUTRIENT_PIPS }, (_, i) => (
            <div key={i} className={`mana-gem ${i < Math.floor(player.nutrients) ? "" : "empty"}`} />
          ))}
        </div>
        <div className="mana-label">
          {Math.floor(player.nutrients)} / {player.maxNutrients} Nutrients
        </div>
      </div>
      <div className="hand">
        {player.hand.map((cardId, i) => {
          const card = CARD_BY_ID[cardId];
          if (!card) return null;
          return (
            <CardView
              key={`${cardId}-${i}`}
              card={card}
              selected={selectedCardId === cardId}
              affordable={player.nutrients >= card.cost}
              onClick={() => onSelect(cardId)}
            />
          );
        })}
      </div>
      <div className="footer-note">
        {selectedCardId ? "Tap a channel to deploy" : "Tap a card, then tap a channel to deploy"}
      </div>
    </>
  );
}
