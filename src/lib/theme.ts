import type { MeterType } from "./format";

export type MeterAccent = {
  /** CSS variable name (without `var()`) */
  cssVar: string;
  /** Resolved hex — for places where CSS vars don't reach (Recharts SVG fills) */
  hex: string;
};

/** Keep in sync with the --color-elec/cold/hot/heat tokens in globals.css. */
export const meterAccent: Record<MeterType, MeterAccent> = {
  ELECTRICITY: {
    cssVar: "--color-elec",
    hex: "#f0c86a",
  },
  COLD_WATER: {
    cssVar: "--color-cold",
    hex: "#8ec9e2",
  },
  HOT_WATER: {
    cssVar: "--color-hot",
    hex: "#eea08b",
  },
  HEAT: {
    cssVar: "--color-heat",
    hex: "#bcaee8",
  },
};

export function accentFor(type: MeterType): MeterAccent {
  return meterAccent[type];
}
