import type { GameState } from "../game/types";
import Lane from "./Lane";

interface BattlefieldProps {
  state: GameState;
  selectingLane: boolean;
  onLaneSelect: (lane: number) => void;
}

export default function Battlefield({ state, selectingLane, onLaneSelect }: BattlefieldProps) {
  return (
    <div className="battlefield">
      {state.lanes.map((units, i) => (
        <Lane key={i} index={i} units={units} droppable={selectingLane} onSelect={() => onLaneSelect(i)} />
      ))}
    </div>
  );
}
