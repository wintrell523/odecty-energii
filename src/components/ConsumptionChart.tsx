"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber, unitLabel, type Unit } from "@/lib/format";

type Props = {
  data: { label: string; consumption: number }[];
  unit: Unit;
  /** Bar color (hex). Pass the per-meter accent. Defaults to brand cyan. */
  color?: string;
};

export default function ConsumptionChart({
  data,
  unit,
  color = "#06b6d4",
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#27272a"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
          axisLine={{ stroke: "#27272a" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          formatter={(v) => [
            `${formatNumber(Number(v))} ${unitLabel(unit)}`,
            "Spotřeba",
          ]}
          contentStyle={{
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: 8,
            color: "#fafafa",
            fontSize: 12,
            padding: "0.5rem 0.75rem",
          }}
          labelStyle={{ color: "#a1a1aa", marginBottom: "0.25rem" }}
          itemStyle={{ color: "#fafafa", fontVariantNumeric: "tabular-nums" }}
        />
        <Bar
          dataKey="consumption"
          fill={color}
          radius={[4, 4, 0, 0]}
          maxBarSize={42}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
