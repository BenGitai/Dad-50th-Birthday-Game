// Procedural microbe-shaped icons (CSS/SVG), standing in for real card art
// until photos are provided. Shapes loosely follow real bacterial morphology
// so cards are visually distinguishable at a glance, not just by color.
import type { ReactElement, ReactNode } from "react";

function PhageIcon() {
  return (
    <div className="phage-icon">
      <div className="head" />
      <div className="tail" />
      <div className="fibers" />
    </div>
  );
}

const STROKE = "currentColor";

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  );
}

/** Single rod-shaped bacterium (bacillus). */
function RodIcon() {
  return (
    <Svg>
      <rect x="5" y="9" width="14" height="6" rx="3" fill={STROKE} />
    </Svg>
  );
}

/** Thin elongated rod. */
function ThinRodIcon() {
  return (
    <Svg>
      <rect x="3" y="10.5" width="18" height="3" rx="1.5" fill={STROKE} />
    </Svg>
  );
}

/** Rod with a bright spore dot at one end (sporulation). */
function SporeRodIcon() {
  return (
    <Svg>
      <rect x="5" y="9" width="14" height="6" rx="3" fill={STROKE} opacity="0.55" />
      <circle cx="17" cy="12" r="3.4" fill={STROKE} />
    </Svg>
  );
}

/** Rod with trailing flagella (motility / chemotaxis). */
function FlagellatedRodIcon() {
  return (
    <Svg>
      <rect x="7" y="9" width="12" height="6" rx="3" fill={STROKE} />
      <path d="M7 10 C3 9, 2 7, 1 5" stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M6 12 C2 12, 1 12, 0 12" stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M7 14 C3 15, 2 17, 1 19" stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

/** Rod wrapped in a protective capsule layer (resilience). */
function CapsuleRodIcon() {
  return (
    <Svg>
      <rect x="3" y="8.2" width="18" height="7.6" rx="3.8" stroke={STROKE} strokeWidth="1.4" opacity="0.55" />
      <rect x="5.5" y="9.7" width="13" height="4.6" rx="2.3" fill={STROKE} />
    </Svg>
  );
}

/** Curved comma-shaped rod (vibrio). */
function CurvedRodIcon() {
  return (
    <Svg>
      <path d="M19 6 C12 6, 6 9, 6 14 C6 17, 8 18.5, 10.5 18" stroke={STROKE} strokeWidth="4.6" strokeLinecap="round" />
    </Svg>
  );
}

/** Two rods mid-split, joined at a pinched waist (binary fission). */
function DividingRodIcon() {
  return (
    <Svg>
      <ellipse cx="8" cy="12" rx="5" ry="3.4" fill={STROKE} />
      <ellipse cx="17" cy="12" rx="5" ry="3.4" fill={STROKE} />
      <rect x="11.5" y="10.8" width="1" height="2.4" fill="#081512" />
    </Svg>
  );
}

/** Two rods linked by a conjugation pilus bridge. */
function ConjugationIcon() {
  return (
    <Svg>
      <rect x="2" y="9.5" width="9" height="5" rx="2.5" fill={STROKE} />
      <rect x="13" y="9.5" width="9" height="5" rx="2.5" fill={STROKE} />
      <line x1="11" y1="12" x2="13" y2="12" stroke={STROKE} strokeWidth="1.4" />
    </Svg>
  );
}

/** Several small rods clustered together (a swarming culture). */
function RodClusterIcon() {
  return (
    <Svg>
      <rect x="3" y="3" width="10" height="4.2" rx="2.1" fill={STROKE} transform="rotate(-18 8 5.1)" />
      <rect x="11" y="10" width="10" height="4.2" rx="2.1" fill={STROKE} transform="rotate(10 16 12.1)" />
      <rect x="4" y="16" width="10" height="4.2" rx="2.1" fill={STROKE} transform="rotate(-6 9 18.1)" />
    </Svg>
  );
}

/** Cluster of small spheres (staphylococcus-style grape cluster). */
function CocciClusterIcon() {
  const pts: [number, number][] = [
    [9, 8], [15, 7], [12, 12], [18, 12], [8, 15], [14, 16],
  ];
  return (
    <Svg>
      {pts.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3.1" fill={STROKE} opacity={0.9} />
      ))}
    </Svg>
  );
}

/** Coccus cluster wrapped in a protective ring (resistance / shield). */
function ShieldedCocciIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="10" stroke={STROKE} strokeWidth="1.3" opacity="0.6" />
      {[[8, 9], [15, 9], [12, 14]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3.2" fill={STROKE} />
      ))}
    </Svg>
  );
}

/** Branching filament (actinomycete / streptomyces-style). */
function FilamentIcon() {
  return (
    <Svg>
      <path
        d="M12 21 L12 10 M12 14 L7 9 M12 12 L17 7 M12 10 L8 5 M12 10 L16 5"
        stroke={STROKE}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Petri dish with small colonies inside (structure: spawner). */
function DishIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="9" stroke={STROKE} strokeWidth="1.6" />
      <circle cx="9" cy="10" r="1.6" fill={STROKE} />
      <circle cx="14.5" cy="13.5" r="1.6" fill={STROKE} />
      <circle cx="13" cy="8.5" r="1.2" fill={STROKE} />
    </Svg>
  );
}

/** Lattice / matrix pattern (structure: biofilm wall). */
function MatrixIcon() {
  return (
    <Svg>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke={STROKE} strokeWidth="1.4" />
      <path d="M3 9 H21 M3 15 H21 M9 3 V21 M15 3 V21" stroke={STROKE} strokeWidth="1" opacity="0.7" />
    </Svg>
  );
}

/** Rod with a precise edit cut mark (CRISPR). */
function ScissorsCellIcon() {
  return (
    <Svg>
      <rect x="3" y="9" width="18" height="6" rx="3" fill={STROKE} opacity="0.5" />
      <line x1="12" y1="6" x2="12" y2="18" stroke={STROKE} strokeWidth="1.4" strokeDasharray="2.5 2" />
      <path d="M9 6 L12 9 L15 6 M9 18 L12 15 L15 18" stroke={STROKE} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

/** Wavy spiral bacterium (spirochaete: Treponema, Borrelia). */
function SpiralIcon() {
  return (
    <Svg>
      <path
        d="M4 12 C5 8, 8 7, 10 10 C12 13, 15 14, 17 11 C19 8, 21 8, 21 10"
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/** Three cocci in a chain (Streptococcus). */
function ChainCocciIcon() {
  return (
    <Svg>
      <circle cx="6" cy="12" r="3.6" fill={STROKE} />
      <circle cx="12" cy="12" r="3.6" fill={STROKE} />
      <circle cx="18" cy="12" r="3.6" fill={STROKE} />
    </Svg>
  );
}

/** Large cell with a small bud (replicating / budding organism). */
function BuddingCellIcon() {
  return (
    <Svg>
      <circle cx="11" cy="13" r="6" fill={STROKE} />
      <circle cx="18" cy="8" r="3.2" fill={STROKE} opacity="0.85" />
    </Svg>
  );
}

const SHAPES: Record<string, () => ReactElement> = {
  phage: PhageIcon,
  rod: RodIcon,
  "thin-rod": ThinRodIcon,
  "spore-rod": SporeRodIcon,
  "flagellated-rod": FlagellatedRodIcon,
  "capsule-rod": CapsuleRodIcon,
  "curved-rod": CurvedRodIcon,
  "dividing-rod": DividingRodIcon,
  conjugation: ConjugationIcon,
  "rod-cluster": RodClusterIcon,
  "cocci-cluster": CocciClusterIcon,
  "shielded-cocci": ShieldedCocciIcon,
  filament: FilamentIcon,
  dish: DishIcon,
  matrix: MatrixIcon,
  "scissors-cell": ScissorsCellIcon,
  spiral: SpiralIcon,
  "chain-cocci": ChainCocciIcon,
  "budding-cell": BuddingCellIcon,
};

export default function CardIcon({ icon }: { icon: string }) {
  const Shape = SHAPES[icon];
  if (Shape) return <Shape />;
  return <>{icon}</>;
}
