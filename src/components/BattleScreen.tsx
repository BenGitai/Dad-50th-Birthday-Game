import { useEffect, useState } from "react";
import { useGameStore } from "../state/gameStore";
import Battlefield from "./Battlefield";
import Hand from "./Hand";
import TopBar from "./TopBar";

interface BattleScreenProps {
  playerDeck: string[];
  enemyDeck: string[];
  onExit: () => void;
}

export default function BattleScreen({ playerDeck, enemyDeck, onExit }: BattleScreenProps) {
  const { engine, version, startMatch, playCard, stopMatch } = useGameStore();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  useEffect(() => {
    startMatch(playerDeck, enemyDeck);
    return () => stopMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!engine) return null;
  const state = engine.state;
  void version; // forces re-render subscription; engine.state is mutated in place

  const handleSelectCard = (cardId: string) => {
    setSelectedCardId((prev) => (prev === cardId ? null : cardId));
  };

  const handleLaneSelect = (lane: number) => {
    if (!selectedCardId) return;
    const ok = playCard(selectedCardId, lane);
    if (ok) setSelectedCardId(null);
  };

  return (
    <div className="screen" style={{ position: "relative" }}>
      <TopBar player={state.player} enemy={state.enemy} elapsedSeconds={state.elapsedSeconds} />
      <Battlefield state={state} selectingLane={!!selectedCardId} onLaneSelect={handleLaneSelect} />
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
