import { useMemo, useState } from "react";
import type { CardDef } from "../game/types";
import { MAX_DECK_SIZE, MIN_DECK_SIZE, PACKS, TOTAL_PACK_PICKS, openPack } from "../game/data/packs";
import CardIcon from "./CardIcon";
import CardView from "./CardView";
import MiniCard from "./MiniCard";

interface PackSelectScreenProps {
  onConfirm: (deck: string[]) => void;
}

export default function PackSelectScreen({ onConfirm }: PackSelectScreenProps) {
  const [chosenPackIds, setChosenPackIds] = useState<string[]>([]);
  const [pool, setPool] = useState<CardDef[] | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [revealIndex, setRevealIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

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
    setRevealIndex(0);
    setFlipped(false);
  };

  const advanceReveal = () => {
    if (!pool) return;
    if (!flipped) {
      setFlipped(true);
      return;
    }
    if (revealIndex + 1 >= pool.length) {
      setRevealIndex(pool.length);
    } else {
      setRevealIndex((i) => i + 1);
      setFlipped(false);
    }
  };

  const skipReveal = () => {
    if (pool) setRevealIndex(pool.length);
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

  if (pool && revealIndex < pool.length) {
    const card = pool[revealIndex];
    return (
      <div className="screen reveal-screen" onClick={advanceReveal}>
        <div className="header">
          <div className="title">Build Your Culture</div>
          <div className="subtitle">{flipped ? "Tap to continue" : "Tap to reveal"}</div>
        </div>
        <div className="reveal-progress">
          Card {revealIndex + 1} / {pool.length}
        </div>
        <div className="reveal-stage">
          {flipped ? (
            <div key={revealIndex} className={`reveal-card-wrap ${card.rarity === "legendary" ? "reveal-legendary" : "reveal-pop"}`}>
              <CardView card={card} large />
            </div>
          ) : (
            <div className="card-back-large">?</div>
          )}
        </div>
        <button
          type="button"
          className="open-packs-cta reveal-skip"
          onClick={(e) => {
            e.stopPropagation();
            skipReveal();
          }}
        >
          Skip to Deck Builder →
        </button>
      </div>
    );
  }

  if (pool) {
    return (
      <div className="screen">
        <div className="header">
          <div className="title">Build Your Culture</div>
          <div className="subtitle">Tap cards to add them to your deck</div>
        </div>
        <div className="divider">Pool from {chosenPackIds.length} packs · {pool.length} cards opened</div>
        <div className="pool-section">
          <div className="pool-header">
            <div className="pool-title">Tap cards to add to deck</div>
            <div className="deck-counter">
              {deckSize} / {MAX_DECK_SIZE}
            </div>
          </div>
          <div className="pool-grid">
            {pool.map((card, i) => (
              <div key={i} className="reveal-pop">
                <MiniCard card={card} inDeck={selectedIndices.has(i)} onClick={() => toggleCard(i)} />
              </div>
            ))}
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
