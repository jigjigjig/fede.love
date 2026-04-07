# Glyph Sequences

Reference document for all ASCII spinner glyph sequences used on the site. Each sequence defines the characters cycled frame-by-frame, their visual intent, and per-glyph Y-axis offsets for optical centering.

---

## Sequence A — Star Morph

**Characters:** `['·', '✻', '✽', '✶', '✳', '✢']`

**Intent:** A delicate progression from a centered dot through increasingly ornate asterisk/star forms. Feels like a spark igniting and settling.

| Frame | Glyph | Y-offset (px) | Notes |
|-------|-------|----------------|-------|
| 0     | `·`   | -1             | Middle dot sits slightly high in most monospace fonts |
| 1     | `✻`   | 0              | Teardrop-spoked asterisk |
| 2     | `✽`   | 0              | Heavy teardrop-spoked asterisk |
| 3     | `✶`   | 0              | Six-pointed black star |
| 4     | `✳`   | 0              | Eight-spoked asterisk |
| 5     | `✢`   | 0              | Cross with open center dot |

---

## Sequence B — Block Density Pulse

**Characters:** `['░', '▒', '▓', '█', '▓', '░']`

**Intent:** Shade block characters breathing between empty and solid — like a pixel pulsing in and out of existence. The sequence is palindromic, creating a smooth inhale/exhale rhythm.

| Frame | Glyph | Y-offset (px) | Notes |
|-------|-------|----------------|-------|
| 0     | `░`   | 0              | Light shade (25%) |
| 1     | `▒`   | 0              | Medium shade (50%) |
| 2     | `▓`   | 0              | Dark shade (75%) |
| 3     | `█`   | 0              | Full block (100%) |
| 4     | `▓`   | 0              | Dark shade — exhale begins |
| 5     | `░`   | 0              | Light shade — cycle resets |

---

## Sequence C — Braille Matrix Rotation

**Characters:** `['⣾', '⣽', '⣻', '⢿', '⡿', '⣟']`

**Intent:** Heavy braille dot patterns where the "missing" dot orbits around the cell, creating the illusion of rotation. Classic terminal spinner DNA but with maximum weight — almost every dot is lit, with one gap sweeping clockwise.

| Frame | Glyph | Y-offset (px) | Notes |
|-------|-------|----------------|-------|
| 0     | `⣾`   | 0              | Gap at bottom-right dot 8 |
| 1     | `⣽`   | 0              | Gap at dot 7 |
| 2     | `⣻`   | 0              | Gap at dot 6 |
| 3     | `⢿`   | 0              | Gap at dot 5 |
| 4     | `⡿`   | 0              | Gap at dot 4 |
| 5     | `⣟`   | 0              | Gap at dot 3 |

---

## Sequence D — Quadrant Triangle Sweep

**Characters:** `['◢', '◣', '◤', '◥', '◢', '◣']`

**Intent:** Corner-fill triangles rotating through quadrants like a radar sweep or a clock hand made of solid geometry. The filled corner moves clockwise. The sequence is 6 frames (repeating first two) to match the other sequences' length.

| Frame | Glyph | Y-offset (px) | Notes |
|-------|-------|----------------|-------|
| 0     | `◢`   | 0              | Bottom-right fill |
| 1     | `◣`   | 0              | Bottom-left fill |
| 2     | `◤`   | 0              | Top-left fill |
| 3     | `◥`   | 0              | Top-right fill |
| 4     | `◢`   | 0              | Bottom-right — second pass begins |
| 5     | `◣`   | 0              | Bottom-left |

---

## Timing

All sequences share the same variable timing profile. First and last frames are held longer to create a "breath" effect:

```
Frame durations (ms): [200, 90, 90, 90, 90, 200]
```

Total cycle time: ~760ms per full pass.

---

## Rendering

All glyphs render in pure white (`#fff`) on the dark background. Each glyph is wrapped in an `inline-block` span with its Y-offset applied via `transform: translateY(Npx)` to prevent baseline jumping between frames.

---

## Usage Patterns

Spinners appear in three distinct patterns across the site, each with different props and intent.

### Boot Pattern

Used as the opening animation when a page loads. All four sequences run simultaneously at default size, completing a fixed number of cycles before firing `onComplete`.

| Prop       | Value     |
|------------|-----------|
| `infinite` | `false`   |
| `speed`    | `1`       |
| `size`     | `20` (lab) or inherited (index) |
| Cycles     | 3 (~2.3s total) |

**Purpose:** Establish rhythm, prime the user for motion. The four glyphs dancing together form a "power-on self-test" moment — the page announces itself before content arrives.

### Section Marker Pattern

Each content section is prefixed by a persistent spinner from a unique sequence. The spinner runs forever and reacts to hover by doubling its speed.

| Prop       | Default   | On hover  |
|------------|-----------|-----------|
| `infinite` | `true`    | `true`    |
| `speed`    | `1`       | `0.5`     |
| `size`     | inherited | inherited |

**Assignment:**
- Sequence A (star morph) → projects
- Sequence B (block density) → thoughts
- Sequence C (braille rotation) → reads
- Sequence D (triangle sweep) → links

**Purpose:** Ambient heartbeat. The spinner IS the section marker — it replaces a bullet or heading decoration. Hover acceleration creates a microinteraction that signals responsiveness without any layout shift.

### Footer Signature Pattern

A row of all four spinners at reduced size, placed below a separator. A quiet visual signature.

| Prop       | Value     |
|------------|-----------|
| `infinite` | `true`    |
| `speed`    | `1`       |
| `size`     | `11`      |

**Purpose:** Visual closure. The same four glyphs that opened the page now sit at the bottom, still running. The page is bookended by its own pulse.

---

## Accessibility

When `prefers-reduced-motion: reduce` is active, all spinner animation stops. Each spinner displays its first glyph as a static section marker. The content stagger is skipped — all sections appear immediately. The page remains fully scannable and functional.
