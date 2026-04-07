import { useState, useEffect, useRef } from "react";

export interface SequenceConfig {
  glyphs: string[];
  offsets: number[];
}

export const SEQUENCES: SequenceConfig[] = [
  {
    glyphs: ["·", "✻", "✽", "✶", "✳", "✢"],
    offsets: [-1, 0, 0, 0, 0, 0],
  },
  {
    glyphs: ["░", "▒", "▓", "█", "▓", "░"],
    offsets: [0, 0, 0, 0, 0, 0],
  },
  {
    glyphs: ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟"],
    offsets: [0, 0, 0, 0, 0, 0],
  },
  {
    glyphs: ["◢", "◣", "◤", "◥", "◢", "◣"],
    offsets: [0, 0, 0, 0, 0, 0],
  },
];

export const FRAME_DURATIONS = [200, 90, 90, 90, 90, 200];
const TOTAL_CYCLES = 3;

interface SingleSpinnerProps {
  sequence: SequenceConfig;
  infinite?: boolean;
  speed?: number;
  size?: number;
}

export function SingleSpinner({
  sequence,
  infinite = false,
  speed = 1,
  size,
}: SingleSpinnerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const cycleRef = useRef(0);
  const timeoutId = useRef<ReturnType<typeof setTimeout>>();
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    cycleRef.current = 0;

    const schedule = (currentFrame: number) => {
      const delay = FRAME_DURATIONS[currentFrame] * speedRef.current;
      timeoutId.current = setTimeout(() => {
        const nextFrame = (currentFrame + 1) % sequence.glyphs.length;
        if (nextFrame === 0) cycleRef.current++;

        if (!infinite && cycleRef.current >= TOTAL_CYCLES) return;

        setFrameIndex(nextFrame);
        schedule(nextFrame);
      }, delay);
    };

    schedule(0);

    return () => {
      if (timeoutId.current) clearTimeout(timeoutId.current);
    };
  }, [sequence.glyphs.length, infinite]);

  const glyph = sequence.glyphs[frameIndex];
  const offset = sequence.offsets[frameIndex];

  return (
    <span
      style={{
        display: "inline-block",
        transform: `translateY(${offset}px)`,
        color: "#fff",
        width: "1ch",
        height: "1em",
        textAlign: "center",
        lineHeight: "1em",
        verticalAlign: "baseline",
        fontSize: size ? `${size}px` : undefined,
      }}
    >
      {glyph}
    </span>
  );
}

interface AsciiSpinnerGroupProps {
  onComplete?: () => void;
  size?: number;
}

export const AsciiSpinnerGroup = ({
  onComplete,
  size,
}: AsciiSpinnerGroupProps) => {
  const [done, setDone] = useState(false);
  const calledRef = useRef(false);

  useEffect(() => {
    const cycleDuration = FRAME_DURATIONS.reduce((a, b) => a + b, 0);
    const totalDuration = cycleDuration * TOTAL_CYCLES;

    const timeout = setTimeout(() => {
      if (calledRef.current) return;
      calledRef.current = true;
      setDone(true);
      onComplete?.();
    }, totalDuration);

    return () => clearTimeout(timeout);
  }, [onComplete]);

  if (done) return null;

  return (
    <div style={{ display: "flex", gap: "0.75em" }}>
      {SEQUENCES.map((seq, i) => (
        <SingleSpinner key={i} sequence={seq} size={size} />
      ))}
    </div>
  );
};
