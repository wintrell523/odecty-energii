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
  /** Bar color (hex). Pass the per-meter accent. Defaults to brand yellow. */
  color?: string;
};

export default function ConsumptionChart({
  data,
  unit,
  color = "#f0c86a",
}: Props) {
  const [metric, setMetric] = useState<"consumption" | "price">("consumption");
  const isPrice = metric === "price";
  const chartData = data.map((month) => ({
    label: month.label,
    value: isPrice ? month.price : month.consumption,
  }));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs accent-muted">
          {isPrice ? "Měsíční cena" : "Měsíční spotřeba"}
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
          stroke="#262d40"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fill: "#8e97ad", fontSize: 11 }}
          axisLine={{ stroke: "#262d40" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#8e97ad", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          cursor={{ fill: "rgba(230,233,242,0.06)" }}
          formatter={(v) => [
            v == null
              ? "—"
              : isPrice
              ? formatPrice(Number(v))
              : `${formatNumber(Number(v))} ${unitLabel(unit)}`,
            isPrice ? "Cena" : "Spotřeba",
          ]}
          contentStyle={{
            background: "#1c2232",
            border: "1px solid #2a3248",
            borderRadius: 8,
            color: "#e6e9f2",
            fontSize: 12,
            padding: "0.5rem 0.75rem",
          }}
          labelStyle={{ color: "#8e97ad", marginBottom: "0.25rem" }}
          itemStyle={{ color: "#e6e9f2", fontVariantNumeric: "tabular-nums" }}
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
