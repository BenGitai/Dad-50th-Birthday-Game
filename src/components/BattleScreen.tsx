import { useEffect, useRef, useState } from "react";
import { CARD_BY_ID } from "../game/data/cards";
import { useGameStore } from "../state/gameStore";
import Battlefield from "./Battlefield";
import Hand from "./Hand";
import TopBar from "./TopBar";

interface SpellFlash {
  lane: number;
  kind: "damage" | "heal" | "buff" | "slow";
  id: number;
}

interface BattleScreenProps {
  playerDeck: string[];
  enemyDeck: string[];
  onExit: () => void;
}

export default function BattleScreen({ playerDeck, enemyDeck, onExit }: BattleScreenProps) {
  const { engine, version, startMatch, playCard, stopMatch } = useGameStore();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [spellFlashes, setSpellFlashes] = useState<SpellFlash[]>([]);
  const flashCounter = useRef(0);

  useEffect(() => {
    startMatch(playerDeck, enemyDeck);
    return () => stopMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!engine) return null;
  const state = engine.state;
  void version;

  const handleSelectCard = (cardId: string) => {
    setSelectedCardId((prev) => (prev === cardId ? null : cardId));
  };

  const handleLaneSelect = (lane: number) => {
    if (!selectedCardId) return;
    const card = CARD_BY_ID[selectedCardId];
    const ok = playCard(selectedCardId, lane);
    if (ok) {
      setSelectedCardId(null);
      if (card?.type === "spell") {
        const id = ++flashCounter.current;
        setSpellFlashes((prev) => [...prev, { lane, kind: card.effect.kind, id }]);
        setTimeout(() => setSpellFlashes((prev) => prev.filter((f) => f.id !== id)), 900);
      }
    }
  };

  return (
    <div className="screen" style={{ position: "relative" }}>
      <TopBar player={state.player} enemy={state.enemy} elapsedSeconds={state.elapsedSeconds} />
      <Battlefield state={state} selectingLane={!!selectedCardId} onLaneSelect={handleLaneSelect} spellFlashes={spellFlashes} />
      <Hand player={state.player} selectedCardId={selectedCardId} onSelect={handleSelectCard} />

      {state.status !== "playing" && (
        <div className="result-overlay">
          <div className={`result-title ${state.status === "won" ? "won" : "lost"}`}>
            {state.status === "won" ? "Colony Triumphant!" : "Colony Overrun"}
          </div>
          <button type="button" className="btn-primary" onClick={onExit}>
            Build a New Culture
          </button>
        </div>
      )}
    </div>
  );
}
