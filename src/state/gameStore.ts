import { create } from "zustand";
import { runEnemyAI } from "../game/engine/ai";
import { GameEngine } from "../game/engine/engine";

interface GameStore {
  engine: GameEngine | null;
  version: number;
  startMatch: (playerDeck: string[], enemyDeck: string[]) => void;
  playCard: (cardId: string, lane: number) => boolean;
  stopMatch: () => void;
}

let rafId: number | null = null;

export const useGameStore = create<GameStore>((set, get) => ({
  engine: null,
  version: 0,

  startMatch: (playerDeck, enemyDeck) => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    const engine = new GameEngine(playerDeck, enemyDeck);
    set({ engine, version: 0 });

    let last = performance.now();
    let aiTimer = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      const { engine: liveEngine } = get();
      if (liveEngine && liveEngine.state.status === "playing") {
        aiTimer += dt;
        if (aiTimer > 1.5) {
          aiTimer = 0;
          runEnemyAI(liveEngine);
        }
        liveEngine.tick(dt);
        set((s) => ({ version: s.version + 1 }));
        rafId = requestAnimationFrame(loop);
      } else {
        set((s) => ({ version: s.version + 1 }));
        rafId = null;
      }
    };
    rafId = requestAnimationFrame(loop);
  },

  playCard: (cardId, lane) => {
    const { engine } = get();
    if (!engine) return false;
    const ok = engine.playCard("player", cardId, lane);
    if (ok) set((s) => ({ version: s.version + 1 }));
    return ok;
  },

  stopMatch: () => {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    set({ engine: null, version: 0 });
  },
}));
