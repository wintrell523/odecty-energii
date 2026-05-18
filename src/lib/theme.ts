import type { MeterType } from "./format";

export type MeterAccent = {
  /** CSS variable name (without `var()`) */
  cssVar: string;
  /** Resolved hex — for places where CSS vars don't reach (Recharts SVG fills) */
  hex: string;
  /** Subtle tinted background, suitable for translucent surfaces */
  tint: string;
};

/** Bright accents tuned for zinc-950/900 dark surfaces. */
export const meterAccent: Record<MeterType, MeterAccent> = {
  ELECTRICITY: {
    cssVar: "--color-elec",
    hex: "#fbbf24", // amber-400
    tint: "rgba(251, 191, 36, 0.12)",
  },
  COLD_WATER: {
    cssVar: "--color-cold",
    hex: "#38bdf8", // sky-400
    tint: "rgba(56, 189, 248, 0.12)",
  },
  HOT_WATER: {
    cssVar: "--color-hot",
    hex: "#fb7185", // rose-400
    tint: "rgba(251, 113, 133, 0.12)",
  },
  HEAT: {
    cssVar: "--color-heat",
    hex: "#a78bfa", // violet-400
    tint: "rgba(167, 139, 250, 0.12)",
  },
};

export function accentFor(type: MeterType): MeterAccent {
  return meterAccent[type];
}
