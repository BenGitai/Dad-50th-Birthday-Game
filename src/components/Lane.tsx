import { useEffect, useState } from "react";
import type { VisualEvent } from "../game/types";
import UnitToken from "./UnitToken";
import type { UnitInstance } from "../game/types";

const LANE_NAMES = ["Channel A", "Channel B", "Channel C"];

interface ActiveShot {
  animId: number;
  fromOwner: "player" | "enemy";
  topPct: number;
}

interface LaneProps {
  index: number;
  units: UnitInstance[];
  droppable: boolean;
  spellFlash: "damage" | "heal" | "buff" | "slow" | null;
  flashId: number | null;
  visualEvents: VisualEvent[];
  onSelect: () => void;
}

let _shotAnimId = 0;

export default function Lane({ index, units, droppable, spellFlash, flashId, visualEvents, onSelect }: LaneProps) {
  const [activeShots, setActiveShots] = useState<ActiveShot[]>([]);

  useEffect(() => {
    const laneEvents = visualEvents.filter((e) => e.laneIndex === index && e.kind === "rangedShot");
    if (laneEvents.length === 0) return;
    const newShots: ActiveShot[] = laneEvents.map((e) => ({
      animId: ++_shotAnimId,
      fromOwner: e.fromOwner,
      topPct: (1 - e.fromProgress) * 100,
    }));
    setActiveShots((prev) => [...prev, ...newShots]);
    const ids = newShots.map((s) => s.animId);
    const timer = setTimeout(
      () => setActiveShots((prev) => prev.filter((s) => !ids.includes(s.animId))),
      550,
    );
    return () => clearTimeout(timer);
  }, [visualEvents, index]);

  return (
    <div className={`lane ${droppable ? "lane-droppable" : ""}`} onClick={onSelect}>
      <div className="lane-hole lane-hole-top" />
      <div className="lane-label">{LANE_NAMES[index]}</div>
      {units.map((u) => (
        <UnitToken key={u.instanceId} unit={u} />
      ))}
      {activeShots.map((shot) => (
        <div
          key={shot.animId}
          className={`ranged-shot ranged-shot-${shot.fromOwner}`}
          style={{ top: `${shot.topPct}%` }}
        />
      ))}
      <div className="lane-hole lane-hole-bottom" />
      {spellFlash && (
        <div
          key={flashId}
          className={`spell-flash spell-flash-${spellFlash}`}
        />
      )}
    </div>
  );
}
