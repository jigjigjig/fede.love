import raw from "../../content/reads.md?raw";

export interface ReadEntry {
  label: string;
  meta: string;
}

function parseReadsList(content: string): ReadEntry[] {
  return content
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.lastIndexOf("|");
      if (sep === -1) return { label: line.trim(), meta: "" };
      return {
        label: line.slice(0, sep).trim(),
        meta: line.slice(sep + 1).trim(),
      };
    });
}

const reads = parseReadsList(raw);

export function getAllReads(): ReadEntry[] {
  return reads;
}
