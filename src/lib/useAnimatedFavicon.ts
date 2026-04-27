import { useEffect } from "react";
import { FRAME_DURATIONS, SEQUENCES } from "../components/AsciiSpinner";

const FAVICON_SEQUENCE = SEQUENCES[1];

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function faviconHrefFor(glyph: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#0f172a"/><text x="50%" y="53%" fill="#e2e8f0" font-family="Menlo, Consolas, 'Courier New', monospace" font-size="36" font-weight="700" text-anchor="middle" dominant-baseline="middle">${escapeXml(glyph)}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function getFaviconLink() {
  const existing = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (existing) return existing;

  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  document.head.appendChild(link);
  return link;
}

export function useAnimatedFavicon() {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const link = getFaviconLink();
    let timeoutId: ReturnType<typeof setTimeout>;
    let frameIndex = 0;

    const renderFrame = () => {
      link.href = faviconHrefFor(FAVICON_SEQUENCE.glyphs[frameIndex]);
    };

    const scheduleFrame = () => {
      if (mediaQuery.matches) {
        frameIndex = 0;
        renderFrame();
        return;
      }

      renderFrame();
      timeoutId = setTimeout(() => {
        frameIndex = (frameIndex + 1) % FAVICON_SEQUENCE.glyphs.length;
        scheduleFrame();
      }, FRAME_DURATIONS[frameIndex]);
    };

    const handleMotionPreferenceChange = () => {
      clearTimeout(timeoutId);
      scheduleFrame();
    };

    scheduleFrame();
    mediaQuery.addEventListener("change", handleMotionPreferenceChange);

    return () => {
      clearTimeout(timeoutId);
      mediaQuery.removeEventListener("change", handleMotionPreferenceChange);
    };
  }, []);
}
