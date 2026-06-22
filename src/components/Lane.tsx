import type { UnitInstance } from "../game/types";
import UnitToken from "./UnitToken";

const LANE_NAMES = ["Channel A", "Channel B", "Channel C"];

interface LaneProps {
  index: number;
  units: UnitInstance[];
  droppable: boolean;
  onSelect: () => void;
}

export default function Lane({ index, units, droppable, onSelect }: LaneProps) {
  return (
    <div className={`lane ${droppable ? "lane-droppable" : ""}`} onClick={onSelect}>
      <div className="lane-hole lane-hole-top" />
      <div className="lane-label">{LANE_NAMES[index]}</div>
      {units.map((u) => (
        <UnitToken key={u.instanceId} unit={u} />
      ))}
      <div className="lane-hole lane-hole-bottom" />
    </div>
  );
}
