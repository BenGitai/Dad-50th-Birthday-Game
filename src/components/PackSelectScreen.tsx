import { useEffect, useMemo, useState } from "react";
import type { CardDef } from "../game/types";
import { MAX_DECK_SIZE, MIN_DECK_SIZE, PACKS, TOTAL_PACK_PICKS, openPack } from "../game/data/packs";
import CardIcon from "./CardIcon";
import MiniCard from "./MiniCard";

const REVEAL_INTERVAL_MS = 220;

interface PackSelectScreenProps {
  onConfirm: (deck: string[]) => void;
}

export default function PackSelectScreen({ onConfirm }: PackSelectScreenProps) {
  const [chosenPackIds, setChosenPackIds] = useState<string[]>([]);
  const [pool, setPool] = useState<CardDef[] | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    if (!pool || revealedCount >= pool.length) return;
    const t = setTimeout(() => setRevealedCount((c) => Math.min(pool.length, c + 1)), REVEAL_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [pool, revealedCount]);

  const spentPicks = chosenPackIds.reduce((sum, id) => sum + (PACKS.find((p) => p.id === id)?.pickCost ?? 0), 0);
  const remainingPicks = TOTAL_PACK_PICKS - spentPicks;

  const addPack = (packId: string) => {
    const pack = PACKS.find((p) => p.id === packId);
    if (!pack || pack.pickCost > remainingPicks) return;
    setChosenPackIds((prev) => [...prev, packId]);
  };

  const removeAt = (idx: number) => {
    setChosenPackIds((prev) => prev.filter((_, i) => i !== idx));
  };

  const openChosenPacks = () => {
    const cards = chosenPackIds.flatMap((id) => {
      const pack = PACKS.find((p) => p.id === id)!;
      return openPack(pack);
    });
    setPool(cards);
    setSelectedIndices(new Set());
    setRevealedCount(0);
  };

  const skipReveal = () => {
    if (pool) setRevealedCount(pool.length);
  };

  const toggleCard = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        if (next.size >= MAX_DECK_SIZE) return prev;
        next.add(idx);
      }
      return next;
    });
  };

  const deckSize = selectedIndices.size;
  const canConfirm = deckSize >= MIN_DECK_SIZE && deckSize <= MAX_DECK_SIZE;

  const confirm = () => {
    if (!pool || !canConfirm) return;
    const deck = Array.from(selectedIndices).map((i) => pool[i].id);
    onConfirm(deck);
  };

  const trayLabel = useMemo(() => {
    const slots = Array.from({ length: TOTAL_PACK_PICKS }, () => "");
    let slotIdx = 0;
    for (const id of chosenPackIds) {
      const pack = PACKS.find((p) => p.id === id)!;
      for (let i = 0; i < pack.pickCost && slotIdx < TOTAL_PACK_PICKS; i++, slotIdx++) {
        slots[slotIdx] = pack.icon;
      }
    }
    return slots;
  }, [chosenPackIds]);

  if (pool) {
    const stillRevealing = revealedCount < pool.length;
    return (
      <div className="screen">
        <div className="header">
          <div className="title">Build Your Culture</div>
          <div className="subtitle">{stillRevealing ? "Opening packs… tap to reveal faster" : "Tap cards to add them to your deck"}</div>
        </div>
        <div className="divider">Pool from {chosenPackIds.length} packs · {pool.length} cards opened</div>
        <div className="pool-section">
          <div className="pool-header">
            <div className="pool-title">Tap cards to add to deck</div>
            <div className="deck-counter">
              {deckSize} / {MAX_DECK_SIZE}
            </div>
          </div>
          <div className="pool-grid" onClick={stillRevealing ? skipReveal : undefined}>
            {pool.map((card, i) =>
              i < revealedCount ? (
                <div key={i} className={`reveal-pop ${card.rarity === "legendary" ? "reveal-legendary" : ""}`}>
                  <MiniCard card={card} inDeck={selectedIndices.has(i)} onClick={() => toggleCard(i)} />
                </div>
              ) : (
                <div key={i} className="mini-card-back">?</div>
              ),
            )}
          </div>
        </div>
        <button type="button" className="cta" disabled={!canConfirm} onClick={confirm}>
          {canConfirm ? `Confirm Deck (${deckSize} / ${MAX_DECK_SIZE}) →` : `Pick at least ${MIN_DECK_SIZE} cards`}
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="header">
        <div className="title">Build Your Culture</div>
        <div className="subtitle">Choose 3 packs to draw your card pool from</div>
      </div>
      <div className="pack-row">
        {PACKS.map((pack) => {
          const disabled = pack.pickCost > remainingPicks;
          return (
            <button
              type="button"
              key={pack.id}
              className={`pack ${pack.type === "legendary" ? "legendary" : ""} ${disabled ? "disabled" : ""}`}
              onClick={() => addPack(pack.id)}
              disabled={disabled}
            >
              {pack.pickCost > 1 && <div className="pack-cost">x{pack.pickCost}</div>}
              <div className="pack-icon">
                <CardIcon icon={pack.icon} />
              </div>
              <div className="pack-name">{pack.name}</div>
              <div className="pack-desc">{pack.description}</div>
            </button>
          );
        })}
      </div>

      <div className="selected-tray">
        {trayLabel.map((icon, i) => (
          <div
            key={i}
            className={`slot ${icon ? "filled" : ""}`}
            onClick={() => {
              if (!icon) return;
              // remove the pack that occupies this slot
              let consumed = 0;
              for (let p = 0; p < chosenPackIds.length; p++) {
                const pack = PACKS.find((x) => x.id === chosenPackIds[p])!;
                if (i < consumed + pack.pickCost) {
                  removeAt(p);
                  return;
                }
                consumed += pack.pickCost;
              }
            }}
          >
            {icon ? <CardIcon icon={icon} /> : ""}
          </div>
        ))}
      </div>

      <button type="button" className="open-packs-cta" disabled={remainingPicks !== 0} onClick={openChosenPacks}>
        {remainingPicks === 0 ? "Open Packs →" : `Choose ${remainingPicks} more pick${remainingPicks === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
