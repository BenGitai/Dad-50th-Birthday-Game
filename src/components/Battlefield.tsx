import type { GameState } from "../game/types";
import Lane from "./Lane";

interface SpellFlash {
  lane: number;
  kind: "damage" | "heal" | "buff" | "slow";
  id: number;
}

interface BattlefieldProps {
  state: GameState;
  selectingLane: boolean;
  spellFlashes: SpellFlash[];
  onLaneSelect: (lane: number) => void;
}

export default function Battlefield({ state, selectingLane, spellFlashes, onLaneSelect }: BattlefieldProps) {
  return (
    <div className="battlefield">
      {state.lanes.map((units, i) => {
        const flash = spellFlashes.find((f) => f.lane === i);
        return (
          <Lane
            key={i}
            index={i}
            units={units}
            droppable={selectingLane}
            spellFlash={flash?.kind ?? null}
            flashId={flash?.id ?? null}
            onSelect={() => onLaneSelect(i)}
          />
        );
      })}
    </div>
  );
}
