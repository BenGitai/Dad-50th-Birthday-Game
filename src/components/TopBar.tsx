import type { PlayerState } from "../game/types";

interface TopBarProps {
  player: PlayerState;
  enemy: PlayerState;
  elapsedSeconds: number;
}

export default function TopBar({ player, enemy, elapsedSeconds }: TopBarProps) {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = Math.floor(elapsedSeconds % 60)
    .toString()
    .padStart(2, "0");

  return (
    <div className="topbar">
      <div className="base enemy">
        <div className="base-icon">🧫</div>
        <div className="hp-wrap">
          <div className="hp-label">Enemy Colony</div>
          <div className="hp-bar">
            <div className="hp-fill" style={{ width: `${(enemy.baseHp / enemy.maxBaseHp) * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="turn-pill">{minutes}:{seconds}</div>
      <div className="base player">
        <div className="hp-wrap" style={{ alignItems: "flex-end" }}>
          <div className="hp-label">Your Colony</div>
          <div className="hp-bar">
            <div className="hp-fill player" style={{ width: `${(player.baseHp / player.maxBaseHp) * 100}%` }} />
          </div>
        </div>
        <div className="base-icon">🧫</div>
      </div>
    </div>
  );
}
