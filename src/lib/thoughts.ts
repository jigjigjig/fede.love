const modules = import.meta.glob<string>("../../content/thoughts/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export interface Thought {
  slug: string;
  title: string;
  date: string;
  body: string;
}

function parseFrontmatter(raw: string): { attrs: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { attrs: {}, body: raw };
  const attrs: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    attrs[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { attrs, body: match[2] };
}

function slugFromPath(path: string): string {
  return path.split("/").pop()!.replace(/\.md$/, "");
}

const thoughts: Thought[] = Object.entries(modules)
  .map(([path, raw]) => {
    const { attrs, body } = parseFrontmatter(raw);
    return {
      slug: slugFromPath(path),
      title: attrs.title ?? slugFromPath(path),
      date: attrs.date ?? "",
      body,
    };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

export function getAllThoughts(): Thought[] {
  return thoughts;
}

export function getThought(slug: string): Thought | undefined {
  return thoughts.find((t) => t.slug === slug);
}
