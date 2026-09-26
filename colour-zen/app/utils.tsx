import { colornames } from "color-name-list";
import { closestMatch } from "closest-match";

const savedColorsKey = "savedColourZenColours";

type ColorNameWithRGB = {
  name: string;
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
};

export type SavedColor = {
  color: string;
  name: string;
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

const mappedColorNames: ColorNameWithRGB[] = colornames.map((c) => {
  return {
    name: c.name,
    hex: c.hex,
    rgb: hexToRgb(c.hex),
  };
});

export function getRandomColor() {
  const color = Math.floor(Math.random() * 0x1000000)
    .toString(16)
    .padStart(6, "0");
  return `#${color}`;
}

export function shouldUseDarkText(bgColor: string): boolean {
  let color = bgColor.substring(1, 7);
  let r = parseInt(color.substring(0, 2), 16); // hexToR
  let g = parseInt(color.substring(2, 4), 16); // hexToG
  let b = parseInt(color.substring(4, 6), 16); // hexToB
  let L = Math.round((r * 299 + g * 587 + b * 114) / 1000);
  return L >= 150;
}

export function getClosestColorName(hex: string): string | undefined {
  const targetRgb = hexToRgb(hex);
  let closest = mappedColorNames[0];
  let closestDistance = Infinity;

  for (const colour of mappedColorNames) {
    const rgb = colour.rgb;
    const dr = targetRgb.r - rgb.r;
    const dg = targetRgb.g - rgb.g;
    const db = targetRgb.b - rgb.b;
    const distance = dr * dr + dg * dg + db * db;

    if (distance < closestDistance) {
      closestDistance = distance;
      closest = colour;
    }
  }

  return closest.name;
}

export function saveColor(color: SavedColor): SavedColor[] {
  const previouslySavedColors = getSavedColors();
  const isAlreadySaved = previouslySavedColors.some(
    (savedColor) => savedColor.color === color.color,
  );

  if (isAlreadySaved) {
    return previouslySavedColors;
  }
  const savedColors = [...getSavedColors(), color];

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(savedColorsKey, JSON.stringify(savedColors));
    } catch {
      // Keep the current session usable if browser storage is unavailable.
    }
  }

  return savedColors;
}

export function isValidHexColor(value: string): boolean {
  return /^#?(?:[\da-f]{3}|[\da-f]{6})$/i.test(value.trim());
}

export function removeSavedColor(color: string): SavedColor[] {
  const savedColors = getSavedColors().filter(
    (savedColor) => savedColor.color !== color,
  );

  if (typeof window !== "undefined") {
    try {
      if (savedColors.length === 0) {
        window.localStorage.removeItem(savedColorsKey);
      } else {
        window.localStorage.setItem(
          savedColorsKey,
          JSON.stringify(savedColors),
        );
      }
    } catch {
      // Keep the current session usable if browser storage is unavailable.
    }
  }

  return savedColors;
}

export function getSavedColors(): SavedColor[] {
  if (typeof window === "undefined") return [];

  try {
    const savedColors = window.localStorage.getItem(savedColorsKey);
    if (!savedColors) return [];

    const parsed: unknown = JSON.parse(savedColors);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is SavedColor =>
        typeof item?.color === "string" && typeof item?.name === "string",
    );
  } catch {
    return [];
  }
}
