import { useState } from "react";
import "./game.css";
import { MAX_DECK_SIZE } from "./game/data/packs";
import { buildCurvedDeck } from "./game/engine/ai";
import BattleScreen from "./components/BattleScreen";
import PackSelectScreen from "./components/PackSelectScreen";

type Screen = "title" | "packs" | "battle";

function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="title-screen">
      <div className="game-title">🧫 Culture Wars</div>
      <div className="game-subtitle">
        Draft a culture of microbes and treatments, then defend your colony across three channels.
      </div>
      <button type="button" className="btn-primary" onClick={onStart}>
        Start a Run
      </button>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("title");
  const [playerDeck, setPlayerDeck] = useState<string[]>([]);
  const [enemyDeck, setEnemyDeck] = useState<string[]>([]);

  const handleDeckConfirmed = (deck: string[]) => {
    setPlayerDeck(deck);
    setEnemyDeck(buildCurvedDeck(MAX_DECK_SIZE));
    setScreen("battle");
  };

  if (screen === "title") return <TitleScreen onStart={() => setScreen("packs")} />;
  if (screen === "packs") return <PackSelectScreen onConfirm={handleDeckConfirmed} />;
  return <BattleScreen playerDeck={playerDeck} enemyDeck={enemyDeck} onExit={() => setScreen("packs")} />;
}
