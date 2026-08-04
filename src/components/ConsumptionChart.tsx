"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber, formatPrice, unitLabel, type Unit } from "@/lib/format";

type Props = {
  data: { label: string; consumption: number; price: number | null }[];
  unit: Unit;
  /** Bar color (hex). Pass the per-meter accent. Defaults to brand cyan. */
  color?: string;
};

export default function ConsumptionChart({
  data,
  unit,
  color = "#06b6d4",
}: Props) {
  const [metric, setMetric] = useState<"consumption" | "price">("consumption");
  const isPrice = metric === "price";
  const chartData = data.map((month) => ({
    label: month.label,
    value: isPrice ? month.price ?? 0 : month.consumption,
  }));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="smallcaps text-[0.65rem]">
          {isPrice ? "měsíční cena" : "měsíční spotřeba"}
        </p>
        <div className="flex gap-1" aria-label="Zobrazená hodnota v grafu">
          <button
            type="button"
            className={`chip ${!isPrice ? "is-active" : ""}`}
            aria-pressed={!isPrice}
            onClick={() => setMetric("consumption")}
          >
            Spotřeba
          </button>
          <button
            type="button"
            className={`chip ${isPrice ? "is-active" : ""}`}
            aria-pressed={isPrice}
            onClick={() => setMetric("price")}
          >
            Cena
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
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
            isPrice
              ? formatPrice(Number(v))
              : `${formatNumber(Number(v))} ${unitLabel(unit)}`,
            isPrice ? "Cena" : "Spotřeba",
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
          dataKey="value"
          fill={color}
          radius={[4, 4, 0, 0]}
          maxBarSize={42}
        />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
