import { useMemo, useState } from "react";
import type { CardDef } from "../game/types";
import { MAX_DECK_SIZE, MIN_DECK_SIZE, PACKS, TOTAL_PACK_PICKS, openPack } from "../game/data/packs";
import CardIcon from "./CardIcon";
import CardView from "./CardView";
import MiniCard from "./MiniCard";

type RevealStage = "closed" | "commons" | "legendary";

interface PackSelectScreenProps {
  onConfirm: (deck: string[]) => void;
}

export default function PackSelectScreen({ onConfirm }: PackSelectScreenProps) {
  const [chosenPackIds, setChosenPackIds] = useState<string[]>([]);
  const [openedPacks, setOpenedPacks] = useState<CardDef[][] | null>(null);
  const [currentPackIdx, setCurrentPackIdx] = useState(0);
  const [revealStage, setRevealStage] = useState<RevealStage>("closed");
  const [legendaryIndex, setLegendaryIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

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
    const opened = chosenPackIds.map((id) => openPack(PACKS.find((p) => p.id === id)!));
    setOpenedPacks(opened);
    setCurrentPackIdx(0);
    setRevealStage("closed");
    setLegendaryIndex(0);
    setFlipped(false);
    setSelectedIndices(new Set());
  };

  const pool = useMemo(() => openedPacks?.flat() ?? null, [openedPacks]);
  const allPacksOpened = openedPacks !== null && currentPackIdx >= chosenPackIds.length;

  const advanceToNextPack = () => {
    setCurrentPackIdx((i) => i + 1);
    setRevealStage("closed");
    setLegendaryIndex(0);
    setFlipped(false);
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

  if (openedPacks && !allPacksOpened) {
    const packId = chosenPackIds[currentPackIdx];
    const packDef = PACKS.find((p) => p.id === packId)!;
    const cards = openedPacks[currentPackIdx];
    const legendaryEntries = cards.filter((c) => c.rarity === "legendary");
    const commonEntries = cards.filter((c) => c.rarity !== "legendary");
    const isLastPack = currentPackIdx + 1 >= chosenPackIds.length;

    if (revealStage === "closed") {
      return (
        <div className="screen reveal-screen" onClick={() => setRevealStage("commons")}>
          <div className="header">
            <div className="title">Build Your Culture</div>
            <div className="subtitle">
              Pack {currentPackIdx + 1} / {chosenPackIds.length}
            </div>
          </div>
          <div className="reveal-stage">
            <div className="pack-intro-card">
              <div className="pack-intro-icon">
                <CardIcon icon={packDef.icon} />
              </div>
              <div className="pack-intro-name">{packDef.name}</div>
              <div className="pack-intro-tap">Tap to Open</div>
            </div>
          </div>
        </div>
      );
    }

    if (revealStage === "commons") {
      return (
        <div className="screen">
          <div className="header">
            <div className="title">{packDef.name}</div>
            <div className="subtitle">{commonEntries.length} cards opened</div>
          </div>
          <div className="pool-section">
            <div className="pool-grid commons-reveal-grid">
              {commonEntries.map((card, i) => (
                <div key={i} className="reveal-pop" style={{ animationDelay: `${i * 40}ms` }}>
                  <MiniCard card={card} inDeck={false} onClick={() => {}} />
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="cta"
            onClick={() => (legendaryEntries.length > 0 ? setRevealStage("legendary") : advanceToNextPack())}
          >
            {legendaryEntries.length > 0
              ? `Reveal ${legendaryEntries.length > 1 ? "Legendaries" : "Legendary"} →`
              : isLastPack
                ? "Continue →"
                : "Next Pack →"}
          </button>
        </div>
      );
    }

    // revealStage === "legendary"
    if (legendaryIndex < legendaryEntries.length) {
      const card = legendaryEntries[legendaryIndex];
      const advanceLegendaryReveal = () => {
        if (!flipped) {
          setFlipped(true);
          return;
        }
        if (legendaryIndex + 1 >= legendaryEntries.length) {
          advanceToNextPack();
        } else {
          setLegendaryIndex((i) => i + 1);
          setFlipped(false);
        }
      };

      return (
        <div className="screen reveal-screen" onClick={advanceLegendaryReveal}>
          <div className="header">
            <div className="title">{packDef.name}</div>
            <div className="subtitle">{flipped ? "Tap to continue" : "Tap to reveal your legendary"}</div>
          </div>
          {legendaryEntries.length > 1 && (
            <div className="reveal-progress">
              Legendary {legendaryIndex + 1} / {legendaryEntries.length}
            </div>
          )}
          <div className="reveal-stage">
            {flipped ? (
              <div key={legendaryIndex} className="reveal-card-wrap reveal-legendary">
                <CardView card={card} large />
              </div>
            ) : (
              <div className="card-back-large card-back-legendary">?</div>
            )}
          </div>
          <button
            type="button"
            className="open-packs-cta reveal-skip"
            onClick={(e) => {
              e.stopPropagation();
              advanceToNextPack();
            }}
          >
            {isLastPack ? "Skip to Deck Builder →" : "Skip to Next Pack →"}
          </button>
        </div>
      );
    }
  }

  if (pool && allPacksOpened) {
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
              <MiniCard key={i} card={card} inDeck={selectedIndices.has(i)} onClick={() => toggleCard(i)} />
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
