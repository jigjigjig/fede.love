import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  AsciiSpinnerGroup,
  SEQUENCES,
  SingleSpinner,
  type SequenceConfig,
} from "../components/AsciiSpinner";

const SCRAMBLE_SET = Array.from("█▓▒░<>/\\|_-=+*:.");
const MATRIX_SET = Array.from("ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789");
const RAMP = " .,:;irsXA253hMHGS#9B&@";
const DONUT_RAMP = ".,-~:;=!*#$@";

const BRAILLE_DOTS = [
  { dx: 0, dy: 0, bit: 0x1 },
  { dx: 0, dy: 1, bit: 0x2 },
  { dx: 0, dy: 2, bit: 0x4 },
  { dx: 1, dy: 0, bit: 0x8 },
  { dx: 1, dy: 1, bit: 0x10 },
  { dx: 1, dy: 2, bit: 0x20 },
  { dx: 0, dy: 3, bit: 0x40 },
  { dx: 1, dy: 3, bit: 0x80 },
] as const;

const BRAILLE_WIDTH = 72;
const BRAILLE_HEIGHT = 16;
const RIPPLE_WIDTH = 72;
const RIPPLE_HEIGHT = 16;
const MATRIX_WIDTH = 72;
const MATRIX_HEIGHT = 20;
const FIRE_WIDTH = 72;
const FIRE_HEIGHT = 20;
const DONUT_WIDTH = 64;
const DONUT_HEIGHT = 22;

const sequenceFrom = (glyphs: string[], offsets?: number[]): SequenceConfig => ({
  glyphs,
  offsets: offsets ?? glyphs.map(() => 0),
});

const SPINNER_LIBRARY: Array<{ name: string; sequence: SequenceConfig }> = [
  { name: "Star Morph", sequence: SEQUENCES[0] },
  { name: "Block Pulse", sequence: SEQUENCES[1] },
  { name: "Braille Orbit", sequence: SEQUENCES[2] },
  { name: "Triangle Sweep", sequence: SEQUENCES[3] },
  { name: "Line Rotor", sequence: sequenceFrom(["|", "/", "-", "\\", "|", "/"]) },
  { name: "Needle Clock", sequence: sequenceFrom(["↑", "↗", "→", "↘", "↓", "↙"]) },
  { name: "Arc Orbit", sequence: sequenceFrom(["◜", "◠", "◝", "◞", "◡", "◟"]) },
  { name: "Diamond Pulse", sequence: sequenceFrom(["◇", "◈", "◆", "◈", "◇", "◈"]) },
  { name: "Moon Scan", sequence: sequenceFrom(["◐", "◓", "◑", "◒", "◐", "◓"]) },
  { name: "Half Block", sequence: sequenceFrom(["▁", "▃", "▅", "▇", "▅", "▃"]) },
  { name: "Quadrant Flicker", sequence: sequenceFrom(["▘", "▝", "▗", "▖", "▚", "▞"]) },
  { name: "Dot Drift", sequence: sequenceFrom(["⠁", "⠂", "⠄", "⡀", "⢀", "⠠"]) },
  { name: "Braille Comet", sequence: sequenceFrom(["⡿", "⣟", "⣯", "⣷", "⣾", "⣽"]) },
  { name: "Square Flip", sequence: sequenceFrom(["◰", "◳", "◲", "◱", "◰", "◳"]) },
  { name: "Spike Bloom", sequence: sequenceFrom(["✦", "✧", "✶", "✷", "✹", "✺"]) },
  {
    name: "Pulse Core",
    sequence: sequenceFrom(["·", "∙", "●", "◉", "◎", "◌"], [-1, -1, 0, 0, 0, 0]),
  },
];

const EFFECT_KEYS = ["spinners", "plasma", "ripple", "matrix", "fire", "donut"] as const;
type EffectKey = (typeof EFFECT_KEYS)[number];
type EffectsState = Record<EffectKey, boolean>;

const EFFECT_LABELS: Record<EffectKey, string> = {
  spinners: "Spinner swarm",
  plasma: "Braille plasma",
  ripple: "Mouse ripple field",
  matrix: "Matrix rain",
  fire: "ASCII fire",
  donut: "3D donut",
};

const DEFAULT_EFFECTS: EffectsState = {
  spinners: true,
  plasma: true,
  ripple: true,
  matrix: true,
  fire: true,
  donut: true,
};

type MatrixColumn = {
  y: number;
  speed: number;
  trail: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function randomFrom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return reduced;
}

function useFrameLoop(enabled: boolean, fps: number, onFrame: (time: number) => void) {
  const callbackRef = useRef(onFrame);
  callbackRef.current = onFrame;

  useEffect(() => {
    if (!enabled) return;

    let animationId = 0;
    let previous = 0;
    const minDelta = 1000 / fps;

    const tick = (time: number) => {
      if (time - previous >= minDelta) {
        previous = time;
        callbackRef.current(time);
      }
      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [enabled, fps]);
}

function useScrambledHeadline(phrases: string[], reducedMotion: boolean) {
  const [value, setValue] = useState(phrases[0] ?? "");

  useEffect(() => {
    if (phrases.length === 0) return;
    if (reducedMotion) {
      setValue(phrases[0]);
      return;
    }

    let disposed = false;
    let index = 0;
    let current = phrases[0];

    let intervalId: ReturnType<typeof setInterval> | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    setValue(current);

    const scrambleToNext = () => {
      const target = phrases[(index + 1) % phrases.length];
      const maxLength = Math.max(current.length, target.length);
      let frame = 0;

      intervalId = setInterval(() => {
        if (disposed) return;

        let output = "";
        for (let position = 0; position < maxLength; position++) {
          const revealAt = position * 1.25;
          if (frame > revealAt + 8) {
            output += target[position] ?? " ";
          } else if (frame > revealAt) {
            output += randomFrom(SCRAMBLE_SET);
          } else {
            output += current[position] ?? " ";
          }
        }

        setValue(output);
        frame += 1;

        if (frame > maxLength + 14) {
          if (intervalId) clearInterval(intervalId);
          current = target;
          index = (index + 1) % phrases.length;
          setValue(target);
          timeoutId = setTimeout(scrambleToNext, 1800);
        }
      }, 36);
    };

    timeoutId = setTimeout(scrambleToNext, 1200);

    return () => {
      disposed = true;
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [phrases, reducedMotion]);

  return value;
}

function buildBrailleFrame(time: number, width: number, height: number) {
  const t = time * 0.0014;
  const lines: string[] = [];

  for (let y = 0; y < height; y++) {
    let line = "";
    for (let x = 0; x < width; x++) {
      let mask = 0;

      for (const dot of BRAILLE_DOTS) {
        const sampleX = x * 2 + dot.dx;
        const sampleY = y * 4 + dot.dy;

        const waveA = Math.sin(sampleX * 0.18 + t * 2.2);
        const waveB = Math.cos(sampleY * 0.23 - t * 1.7);
        const waveC = Math.sin((sampleX + sampleY) * 0.11 + t * 1.4);
        const value = waveA + waveB + waveC;

        if (value > 0.35) {
          mask |= dot.bit;
        }
      }

      line += mask === 0 ? " " : String.fromCodePoint(0x2800 + mask);
    }
    lines.push(line);
  }

  return lines.join("\n");
}

function buildRippleFrame(
  time: number,
  width: number,
  height: number,
  pointer: { x: number; y: number } | null,
) {
  const centerX = pointer?.x ?? width * 0.5 + Math.sin(time * 0.0008) * width * 0.22;
  const centerY = pointer?.y ?? height * 0.5 + Math.cos(time * 0.001) * height * 0.26;
  const lines: string[] = [];

  for (let y = 0; y < height; y++) {
    let line = "";
    for (let x = 0; x < width; x++) {
      const distance = Math.hypot(x - centerX, y - centerY);

      const ripple = Math.sin(distance * 0.88 - time * 0.012) * Math.exp(-distance * 0.08) * 1.42;
      const drift =
        Math.sin((x + time * 0.022) * 0.24) * 0.3 + Math.cos((y - time * 0.019) * 0.4) * 0.24;
      const pulse = Math.sin((x + y) * 0.16 + time * 0.0062) * 0.2;

      const normalized = clamp((ripple + drift + pulse + 1.7) / 3.4, 0, 1);
      const index = Math.floor(normalized * (RAMP.length - 1));

      let glyph = RAMP[index];
      if (distance < 0.9) {
        glyph = "@";
      }

      line += glyph;
    }
    lines.push(line);
  }

  return lines.join("\n");
}

function createMatrixColumns(width: number, height: number) {
  return Array.from({ length: width }, () => ({
    y: -Math.random() * height,
    speed: 0.3 + Math.random() * 0.9,
    trail: 6 + Math.floor(Math.random() * (height * 0.7)),
  }));
}

function advanceMatrix(columns: MatrixColumn[], height: number) {
  for (const column of columns) {
    column.y += column.speed;
    if (column.y - column.trail > height + 8 + Math.random() * 8) {
      column.y = -Math.random() * height;
      column.speed = 0.3 + Math.random() * 0.9;
      column.trail = 6 + Math.floor(Math.random() * (height * 0.7));
    }
  }
}

function buildMatrixFrame(columns: MatrixColumn[], width: number, height: number) {
  const rows: string[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => " "),
  );

  for (let x = 0; x < width; x++) {
    const column = columns[x];
    const head = Math.floor(column.y);

    for (let offset = 0; offset <= column.trail; offset++) {
      const row = head - offset;
      if (row < 0 || row >= height) continue;

      if (offset === 0) {
        rows[row][x] = randomFrom(["█", "▓", "▒"]);
      } else if (offset < column.trail * 0.25) {
        rows[row][x] = randomFrom(["#", "8", "9", "B", "M"]);
      } else {
        rows[row][x] = randomFrom(MATRIX_SET);
      }
    }
  }

  return rows.map((row) => row.join("")).join("\n");
}

function createSeededFireField(width: number, height: number) {
  const field = new Float32Array(width * height);
  const base = (height - 1) * width;
  for (let x = 0; x < width; x++) {
    field[base + x] = 150 + Math.random() * 105;
  }
  return field;
}

function stepFire(current: Float32Array, next: Float32Array, width: number, height: number) {
  const lastRow = height - 1;

  for (let x = 0; x < width; x++) {
    current[lastRow * width + x] = 150 + Math.random() * 105;
  }

  for (let y = 0; y < lastRow; y++) {
    for (let x = 0; x < width; x++) {
      const below = current[(y + 1) * width + x];
      const belowLeft = current[(y + 1) * width + ((x - 1 + width) % width)];
      const belowRight = current[(y + 1) * width + ((x + 1) % width)];
      const decay = Math.random() * 20;

      const value = (below + belowLeft + belowRight) / 3 - decay;
      next[y * width + x] = value > 0 ? value : 0;
    }
  }

  for (let x = 0; x < width; x++) {
    next[lastRow * width + x] = current[lastRow * width + x];
  }
}

function fireToString(field: Float32Array, width: number, height: number) {
  const lines: string[] = [];

  for (let y = 0; y < height; y++) {
    let line = "";
    for (let x = 0; x < width; x++) {
      const value = clamp(field[y * width + x], 0, 255);
      const index = Math.floor((value / 255) * (RAMP.length - 1));
      line += RAMP[index];
    }
    lines.push(line);
  }

  return lines.join("\n");
}

function buildDonutFrame(angleA: number, angleB: number, width: number, height: number) {
  const buffer = new Array<string>(width * height).fill(" ");
  const depth = new Array<number>(width * height).fill(0);

  const sinA = Math.sin(angleA);
  const cosA = Math.cos(angleA);
  const sinB = Math.sin(angleB);
  const cosB = Math.cos(angleB);

  for (let theta = 0; theta < Math.PI * 2; theta += 0.07) {
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let phi = 0; phi < Math.PI * 2; phi += 0.02) {
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const ring = cosTheta + 2;

      const inverseDepth = 1 / (sinPhi * ring * sinA + sinTheta * cosA + 5);
      const mix = sinPhi * ring * cosA - sinTheta * sinA;

      const x = Math.floor(width / 2 + 30 * inverseDepth * (cosPhi * ring * cosB - mix * sinB));
      const y = Math.floor(height / 2 + 14 * inverseDepth * (cosPhi * ring * sinB + mix * cosB));

      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const bufferIndex = x + width * y;
      if (inverseDepth <= depth[bufferIndex]) continue;

      depth[bufferIndex] = inverseDepth;

      const luminance = Math.floor(
        8 *
          ((sinTheta * sinA - sinPhi * cosTheta * cosA) * cosB -
            sinPhi * cosTheta * sinA -
            sinTheta * cosA -
            cosPhi * cosTheta * sinB),
      );

      const rampIndex = clamp(luminance, 0, DONUT_RAMP.length - 1);
      buffer[bufferIndex] = DONUT_RAMP[rampIndex];
    }
  }

  const lines: string[] = [];
  for (let y = 0; y < height; y++) {
    lines.push(buffer.slice(y * width, (y + 1) * width).join(""));
  }
  return lines.join("\n");
}

function StaticGlyph({
  sequence,
  size = 16,
  opacity = 1,
}: {
  sequence: SequenceConfig;
  size?: number;
  opacity?: number;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        width: "1ch",
        height: "1em",
        lineHeight: "1em",
        textAlign: "center",
        color: "#fff",
        verticalAlign: "baseline",
        transform: `translateY(${sequence.offsets[0] ?? 0}px)`,
        fontSize: `${size}px`,
        opacity,
      }}
    >
      {sequence.glyphs[0]}
    </span>
  );
}

function DemoCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section
      data-reveal
      data-visible="false"
      className="ascii-card space-y-4 rounded-md border border-border/80 bg-muted/20 p-5 md:p-6"
    >
      <header className="space-y-1">
        <h2 className="text-[15px] font-medium text-primary">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

function SurfacePanel({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children: ReactNode;
}) {
  return (
    <article className="space-y-2 rounded border border-border/70 bg-background/35 p-3">
      <h3 className="text-xs uppercase tracking-[0.16em] text-primary">{title}</h3>
      <p className="text-[11px] text-muted-foreground">{detail}</p>
      {children}
    </article>
  );
}

function SpinnerCell({
  item,
  active,
  reducedMotion,
}: {
  item: { name: string; sequence: SequenceConfig };
  active: boolean;
  reducedMotion: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const shouldAnimate = active && !reducedMotion;

  return (
    <div
      className="flex items-center justify-between rounded border border-border/60 bg-background/35 px-3 py-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="text-[11px] text-muted-foreground">{item.name}</span>
      {shouldAnimate ? (
        <SingleSpinner
          sequence={item.sequence}
          infinite
          speed={hovered ? 0.45 : 0.92}
          size={16}
        />
      ) : (
        <StaticGlyph sequence={item.sequence} size={16} opacity={0.7} />
      )}
    </div>
  );
}

function BraillePlasmaPanel({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const [frame, setFrame] = useState(() => buildBrailleFrame(0, BRAILLE_WIDTH, BRAILLE_HEIGHT));

  const draw = useCallback((time: number) => {
    setFrame(buildBrailleFrame(time, BRAILLE_WIDTH, BRAILLE_HEIGHT));
  }, []);

  useFrameLoop(active && !reducedMotion, 24, draw);

  useEffect(() => {
    if (!active || reducedMotion) {
      setFrame(buildBrailleFrame(0, BRAILLE_WIDTH, BRAILLE_HEIGHT));
    }
  }, [active, reducedMotion]);

  return <pre className="ascii-surface">{frame}</pre>;
}

function MouseRipplePanel({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const [frame, setFrame] = useState(() =>
    buildRippleFrame(0, RIPPLE_WIDTH, RIPPLE_HEIGHT, pointerRef.current),
  );

  const draw = useCallback((time: number) => {
    setFrame(buildRippleFrame(time, RIPPLE_WIDTH, RIPPLE_HEIGHT, pointerRef.current));
  }, []);

  useFrameLoop(active && !reducedMotion, 30, draw);

  useEffect(() => {
    pointerRef.current = null;
    setFrame(buildRippleFrame(0, RIPPLE_WIDTH, RIPPLE_HEIGHT, null));
  }, [active, reducedMotion]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLPreElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * (RIPPLE_WIDTH - 1);
    const y = ((event.clientY - rect.top) / rect.height) * (RIPPLE_HEIGHT - 1);
    pointerRef.current = { x, y };
  }, []);

  const handlePointerLeave = useCallback(() => {
    pointerRef.current = null;
  }, []);

  return (
    <pre
      className="ascii-surface interactive"
      onPointerMove={active && !reducedMotion ? handlePointerMove : undefined}
      onPointerLeave={active && !reducedMotion ? handlePointerLeave : undefined}
    >
      {frame}
    </pre>
  );
}

function MatrixRainPanel({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const columnsRef = useRef<MatrixColumn[]>([]);
  if (columnsRef.current.length === 0) {
    columnsRef.current = createMatrixColumns(MATRIX_WIDTH, MATRIX_HEIGHT);
  }

  const [frame, setFrame] = useState(() =>
    buildMatrixFrame(columnsRef.current, MATRIX_WIDTH, MATRIX_HEIGHT),
  );

  const draw = useCallback(() => {
    advanceMatrix(columnsRef.current, MATRIX_HEIGHT);
    setFrame(buildMatrixFrame(columnsRef.current, MATRIX_WIDTH, MATRIX_HEIGHT));
  }, []);

  useFrameLoop(active && !reducedMotion, 22, draw);

  useEffect(() => {
    if (!active || reducedMotion) {
      columnsRef.current = createMatrixColumns(MATRIX_WIDTH, MATRIX_HEIGHT);
      setFrame(buildMatrixFrame(columnsRef.current, MATRIX_WIDTH, MATRIX_HEIGHT));
    }
  }, [active, reducedMotion]);

  return <pre className="ascii-surface">{frame}</pre>;
}

function FirePanel({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const initialField = useMemo(() => createSeededFireField(FIRE_WIDTH, FIRE_HEIGHT), []);
  const fieldRef = useRef<Float32Array>(initialField);
  const bufferRef = useRef<Float32Array>(new Float32Array(FIRE_WIDTH * FIRE_HEIGHT));
  const [frame, setFrame] = useState(() => fireToString(fieldRef.current, FIRE_WIDTH, FIRE_HEIGHT));

  const draw = useCallback(() => {
    stepFire(fieldRef.current, bufferRef.current, FIRE_WIDTH, FIRE_HEIGHT);
    const swap = fieldRef.current;
    fieldRef.current = bufferRef.current;
    bufferRef.current = swap;
    setFrame(fireToString(fieldRef.current, FIRE_WIDTH, FIRE_HEIGHT));
  }, []);

  useFrameLoop(active && !reducedMotion, 30, draw);

  useEffect(() => {
    if (!active || reducedMotion) {
      fieldRef.current = createSeededFireField(FIRE_WIDTH, FIRE_HEIGHT);
      bufferRef.current = new Float32Array(FIRE_WIDTH * FIRE_HEIGHT);
      setFrame(fireToString(fieldRef.current, FIRE_WIDTH, FIRE_HEIGHT));
    }
  }, [active, reducedMotion]);

  return <pre className="ascii-surface">{frame}</pre>;
}

function DonutPanel({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  const anglesRef = useRef({ a: 0, b: 0 });
  const [frame, setFrame] = useState(() => buildDonutFrame(0, 0, DONUT_WIDTH, DONUT_HEIGHT));

  const draw = useCallback(() => {
    const angles = anglesRef.current;
    setFrame(buildDonutFrame(angles.a, angles.b, DONUT_WIDTH, DONUT_HEIGHT));
    angles.a += 0.04;
    angles.b += 0.022;
  }, []);

  useFrameLoop(active && !reducedMotion, 30, draw);

  useEffect(() => {
    if (!active || reducedMotion) {
      anglesRef.current = { a: 0, b: 0 };
      setFrame(buildDonutFrame(0, 0, DONUT_WIDTH, DONUT_HEIGHT));
    }
  }, [active, reducedMotion]);

  return <pre className="ascii-surface">{frame}</pre>;
}

const Index = () => {
  const reducedMotion = useReducedMotion();
  const [bootComplete, setBootComplete] = useState(reducedMotion);
  const [effects, setEffects] = useState<EffectsState>(DEFAULT_EFFECTS);
  const revealRootRef = useRef<HTMLDivElement>(null);
  const handleBootComplete = useCallback(() => {
    setBootComplete(true);
  }, []);

  const phrases = useMemo(
    () => [
      "ASCII MOTION LAB // MAXIMAL GLYPH CINEMA",
      "BRAILLE SUBPIXELS + DENSITY FIELDS + TORUS SHADING",
      "SCROLL, HOVER, POINTER, TIMELINE // ALL CHARACTER DRIVEN",
    ],
    [],
  );
  const headline = useScrambledHeadline(phrases, reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setBootComplete(true);
    }
  }, [reducedMotion]);

  useEffect(() => {
    if (!bootComplete) return;
    const root = revealRootRef.current;
    if (!root) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => {
        target.dataset.visible = "true";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const node = entry.target as HTMLElement;
          node.dataset.visible = "true";
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [bootComplete]);

  const isEffectActive = (key: EffectKey) => effects[key] && !reducedMotion;

  return (
    <div className="ascii-demo-shell relative min-h-screen overflow-hidden">
      <div className="crt-overlay" aria-hidden />

      {!bootComplete && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-background/95">
          <AsciiSpinnerGroup onComplete={handleBootComplete} size={24} />
        </div>
      )}

      <main
        ref={revealRootRef}
        className={`relative z-10 mx-auto max-w-[1180px] px-5 py-12 sm:px-8 lg:px-12 ${
          bootComplete ? "animate-fade-in" : "opacity-0"
        }`}
      >
        <section data-reveal data-visible="false" className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">ASCII LIMIT LAB</p>
            <h1 className="whitespace-pre-wrap text-[clamp(1.6rem,4vw,2.75rem)] leading-tight text-primary">
              {headline}
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              One oversized page that fuses curated glyph sequencing, braille subpixel rendering,
              procedural fields, and classic demoscene algorithms into a single ASCII playground.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EFFECT_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                disabled={reducedMotion}
                onClick={() => setEffects((prev) => ({ ...prev, [key]: !prev[key] }))}
                className={`flex items-center justify-between rounded border px-3 py-2 text-xs transition-colors ${
                  effects[key]
                    ? "border-primary/45 bg-primary/10 text-primary"
                    : "border-border/75 bg-muted/25 text-muted-foreground"
                } ${reducedMotion ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <span>{EFFECT_LABELS[key]}</span>
                <span className="text-[10px] tracking-[0.12em]">{effects[key] ? "ON" : "OFF"}</span>
              </button>
            ))}
          </div>

          {reducedMotion && (
            <p className="text-xs text-muted-foreground">
              Reduced motion is enabled, so every panel renders a static first frame.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 rounded border border-border/80 bg-muted/20 p-3">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Core pulse</span>
            <div className="flex items-center gap-3">
              {SEQUENCES.map((sequence, index) => (
                <span key={index}>
                  {reducedMotion ? (
                    <StaticGlyph sequence={sequence} size={16} />
                  ) : (
                    <SingleSpinner sequence={sequence} infinite speed={0.9} size={16} />
                  )}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-8 space-y-6">
          <DemoCard
            title="01 // Spinner Constellation"
            subtitle="Sixteen curated six-frame systems across stars, braille, blocks, arrows, and geometric sweeps."
          >
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {SPINNER_LIBRARY.map((item) => (
                <SpinnerCell
                  key={item.name}
                  item={item}
                  active={isEffectActive("spinners")}
                  reducedMotion={reducedMotion}
                />
              ))}
            </div>
          </DemoCard>

          <DemoCard
            title="02 // Braille Subpixel Engine + Pointer Ripple"
            subtitle="U+2800 braille cells are treated as 2x4 bitmaps, then fused with a live proximity field."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <SurfacePanel
                title="Braille plasma field"
                detail="Procedural waves packed into braille bitmasks at 24 FPS."
              >
                <BraillePlasmaPanel
                  active={isEffectActive("plasma")}
                  reducedMotion={reducedMotion}
                />
              </SurfacePanel>

              <SurfacePanel
                title="Mouse ripple lattice"
                detail="Move the cursor over the panel to inject a high-energy wavefront."
              >
                <MouseRipplePanel
                  active={isEffectActive("ripple")}
                  reducedMotion={reducedMotion}
                />
              </SurfacePanel>
            </div>
          </DemoCard>

          <DemoCard
            title="03 // Procedural Streams"
            subtitle="A Matrix-style falling stream and a classic upward-decay fire system, both rendered as raw characters."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <SurfacePanel
                title="Matrix rain"
                detail="Independent column heads, randomized trail lengths, and glyph decay."
              >
                <MatrixRainPanel active={isEffectActive("matrix")} reducedMotion={reducedMotion} />
              </SurfacePanel>

              <SurfacePanel
                title="ASCII fire"
                detail="Bottom-row heat seeding plus neighbor averaging to propagate flame upward."
              >
                <FirePanel active={isEffectActive("fire")} reducedMotion={reducedMotion} />
              </SurfacePanel>
            </div>
          </DemoCard>

          <DemoCard
            title="04 // 3D Torus Shading"
            subtitle="A rotating donut rendered by depth buffering and luminance-to-glyph mapping in pure text."
          >
            <SurfacePanel
              title="Donut core"
              detail="Character ramp `.,-~:;=!*#$@` mapped to computed light intensity."
            >
              <DonutPanel active={isEffectActive("donut")} reducedMotion={reducedMotion} />
            </SurfacePanel>
          </DemoCard>

          <DemoCard
            title="05 // Stack Summary"
            subtitle="This single page intentionally layers multiple animation paradigms."
          >
            <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <li>Boot sequence with synchronized glyph choreography.</li>
              <li>Variable-speed spinner fleet with hover acceleration.</li>
              <li>Braille sub-cell rasterization for high-density detail.</li>
              <li>Pointer-reactive field simulation for local disturbances.</li>
              <li>Procedural Matrix stream with randomized stateful columns.</li>
              <li>Classic fire propagation model using decay and advection.</li>
              <li>Depth-buffered torus shading via luminance ramp projection.</li>
              <li>Scroll-triggered reveal orchestration and CRT post-processing.</li>
            </ul>
          </DemoCard>
        </div>

        <footer data-reveal data-visible="false" className="mt-8 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-border/80 bg-muted/20 px-4 py-3">
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              ASCII chronicle // extreme demo mode
            </span>
            <div className="flex items-center gap-3">
              {SEQUENCES.map((sequence, index) => (
                <span key={index}>
                  {reducedMotion ? (
                    <StaticGlyph sequence={sequence} size={12} opacity={0.65} />
                  ) : (
                    <SingleSpinner sequence={sequence} infinite speed={1} size={12} />
                  )}
                </span>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
