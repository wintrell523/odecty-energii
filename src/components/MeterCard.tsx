import Link from "next/link";
import {
  formatDate,
  formatNumber,
  formatPrice,
  meterTypeLabel,
  unitLabel,
  type MeterType,
  type Unit,
} from "@/lib/format";
import { gjToKwh } from "@/lib/calculations";
import { accentFor } from "@/lib/theme";

type Props = {
  meter: { id: number; name: string; type: MeterType; unit: Unit };
  latest: { date: Date; value: number } | null;
  previous: { date: Date; value: number } | null;
  monthConsumption: number | null;
  monthPrice: number | null;
};

export default function MeterCard({
  meter,
  latest,
  previous,
  monthConsumption,
  monthPrice,
}: Props) {
  const consumption =
    latest && previous ? latest.value - previous.value : null;
  const accent = accentFor(meter.type);
  const typeLabel = meterTypeLabel(meter.type);

  return (
    <article
      className="card card-accent flex flex-col gap-3"
      style={
        {
          "--accent": `var(${accent.cssVar})`,
          padding: "1rem 1.1rem",
        } as React.CSSProperties
      }
    >
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="truncate text-sm font-semibold">{meter.name}</h3>
        {typeLabel !== meter.name && (
          <span className="text-xs accent-muted shrink-0">{typeLabel}</span>
        )}
      </header>

      {latest ? (
        <div>
          <p className="display numerals accent-text text-3xl">
            {formatNumber(latest.value)}{" "}
            <span className="text-sm font-medium">{unitLabel(meter.unit)}</span>
          </p>
          {monthConsumption != null && (
            <p className="mt-1.5 text-sm numerals accent-muted">
              tento měsíc +{formatNumber(monthConsumption)} {unitLabel(meter.unit)}
              {monthPrice != null && ` · ${formatPrice(monthPrice)}`}
            </p>
          )}
          <p className="mt-0.5 text-xs numerals accent-muted opacity-75">
            stav k {formatDate(latest.date)}
            {consumption != null && previous && (
              <>
                {" "}· od {formatDate(previous.date)} +{formatNumber(consumption)}{" "}
                {unitLabel(meter.unit)}
                {meter.unit === "GJ" &&
                  ` (≈ ${formatNumber(gjToKwh(consumption))} kWh)`}
              </>
            )}
          </p>
        </div>
      ) : (
        <p className="text-sm accent-muted">Žádné odečty zatím.</p>
      )}

      <Link
        href={`/readings/new?meter=${meter.id}`}
        scroll={false}
        className="mt-auto pt-1 w-fit text-sm text-ink-soft hover:text-ink transition-colors"
      >
        Zapsat odečet →
      </Link>
    </article>
  );
}
