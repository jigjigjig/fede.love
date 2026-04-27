import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  AsciiSpinnerGroup,
  SingleSpinner,
  SEQUENCES,
} from "../components/AsciiSpinner";
import { getAllThoughts } from "../lib/thoughts";
import { getAllReads } from "../lib/reads";

const thoughts = getAllThoughts();
const reads = getAllReads();

let hasBooted = false;

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

const glyphBoxStyle: React.CSSProperties = {
  display: "inline-block",
  color: "#fff",
  width: "1ch",
  height: "1em",
  textAlign: "center",
  lineHeight: "1em",
  verticalAlign: "baseline",
};

function StaticGlyph({ sequence }: { sequence: (typeof SEQUENCES)[number] }) {
  return (
    <span
      style={{
        ...glyphBoxStyle,
        transform: `translateY(${sequence.offsets[0]}px)`,
      }}
    >
      {sequence.glyphs[0]}
    </span>
  );
}

function SpinnerSection({
  sequenceIndex,
  title,
  reducedMotion,
  children,
}: {
  sequenceIndex: number;
  title: string;
  reducedMotion: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const sequence = SEQUENCES[sequenceIndex];

  return (
    <section
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {title && (
        <div className="flex items-baseline gap-3 mb-3">
          <span style={glyphBoxStyle}>
            {hovered &&
              (reducedMotion ? (
                <StaticGlyph sequence={sequence} />
              ) : (
                <SingleSpinner sequence={sequence} infinite />
              ))}
          </span>
          <span className="text-muted-foreground text-[13px]">{title}</span>
        </div>
      )}
      <div className={title ? "space-y-1 pl-[calc(1ch+0.75rem)]" : "space-y-1"}>
        {children}
      </div>
    </section>
  );
}

function FooterSpinnerItem({
  sequence,
  reducedMotion,
}: {
  sequence: (typeof SEQUENCES)[number];
  reducedMotion: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <span onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {hovered && !reducedMotion ? (
        <SingleSpinner sequence={sequence} infinite size={11} />
      ) : (
        <span
          style={{
            ...glyphBoxStyle,
            fontSize: "11px",
            opacity: 0.4,
          }}
        >
          {sequence.glyphs[0]}
        </span>
      )}
    </span>
  );
}

const Portfolio = () => {
  const [booted, setBooted] = useState(hasBooted);
  const reducedMotion = useReducedMotion();

  const handleBootComplete = useCallback(() => {
    hasBooted = true;
    setBooted(true);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      hasBooted = true;
      setBooted(true);
    }
  }, [reducedMotion]);

  return (
    <div className="min-h-screen px-6 py-20 sm:px-12 md:px-24 lg:px-32 max-w-[640px]">
      {!booted && (
        <div className="fixed inset-0 flex items-center justify-center">
          <AsciiSpinnerGroup onComplete={handleBootComplete} size={20} />
        </div>
      )}

      {booted && (
        <div className="space-y-14 animate-fade-in">
          <SpinnerSection sequenceIndex={0} title="" reducedMotion={reducedMotion}>
            <div className="space-y-3 text-foreground leading-relaxed">
              <p>
                My name is Federico Cattaneo. I’m a product manager based in
                Europe, currently working at Studocu.
              </p>
              <p className="text-muted-foreground">
                I like shaping software with care, curiosity, and a bias for
                making complex things feel simple.
              </p>
            </div>
          </SpinnerSection>

          <SpinnerSection
            sequenceIndex={1}
            title="thoughts"
            reducedMotion={reducedMotion}
          >
            {thoughts.map((t) => (
              <Link
                key={t.slug}
                to={`/thoughts/${t.slug}`}
                className="flex justify-between gap-4 text-foreground hover:text-accent hover-glow"
              >
                <span>{t.title}</span>
                <span className="text-muted-foreground shrink-0">
                  {t.date}
                </span>
              </Link>
            ))}
          </SpinnerSection>

          <SpinnerSection
            sequenceIndex={2}
            title="reads"
            reducedMotion={reducedMotion}
          >
            {reads.map((r) => (
              <div key={r.label} className="flex justify-between gap-4">
                <span className="text-foreground">{r.label}</span>
                <span className="text-muted-foreground shrink-0">
                  {r.meta}
                </span>
              </div>
            ))}
          </SpinnerSection>

          <SpinnerSection
            sequenceIndex={3}
            title="links"
            reducedMotion={reducedMotion}
          >
            <div className="space-x-4">
              <a
                href="#"
                className="text-foreground hover:text-accent hover-glow"
              >
                github
              </a>
              <a
                href="#"
                className="text-foreground hover:text-accent hover-glow"
              >
                twitter
              </a>
              <a
                href="#"
                className="text-foreground hover:text-accent hover-glow"
              >
                email
              </a>
              <a
                href="#/ascii-lab"
                className="text-foreground hover:text-accent hover-glow"
              >
                ascii-lab
              </a>
            </div>
          </SpinnerSection>

          <footer className="pt-6">
            <div
              className="border-t border-border pt-6"
              style={{ display: "flex", gap: "0.75em" }}
            >
              {SEQUENCES.map((seq, i) => (
                <FooterSpinnerItem key={i} sequence={seq} reducedMotion={reducedMotion} />
              ))}
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
