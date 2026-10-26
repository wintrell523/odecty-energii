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
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{meter.name}</h3>
          {typeLabel !== meter.name && (
            <p className="text-xs accent-muted">{typeLabel}</p>
          )}
        </div>
        {latest && (
          <span
            className="text-xs numerals accent-muted shrink-0"
            title="Datum posledního odečtu"
          >
            {formatDate(latest.date)}
          </span>
        )}
      </header>

      {latest ? (
        <div>
          <p className="display numerals accent-text text-3xl">
            {formatNumber(latest.value)}{" "}
            <span className="text-sm font-medium">{unitLabel(meter.unit)}</span>
          </p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm numerals">
            {monthConsumption != null && (
              <>
                <dt className="accent-muted">Tento měsíc</dt>
                <dd className="text-right">
                  +{formatNumber(monthConsumption)} {unitLabel(meter.unit)}
                </dd>
              </>
            )}
            {monthPrice != null && (
              <>
                <dt className="accent-muted">Cena</dt>
                <dd className="text-right">{formatPrice(monthPrice)}</dd>
              </>
            )}
            {consumption != null && previous && (
              <>
                <dt className="accent-muted">Od {formatDate(previous.date)}</dt>
                <dd className="text-right">
                  +{formatNumber(consumption)} {unitLabel(meter.unit)}
                  {meter.unit === "GJ" && (
                    <span className="block text-xs accent-muted">
                      ≈ {formatNumber(gjToKwh(consumption))} kWh
                    </span>
                  )}
                </dd>
              </>
            )}
          </dl>
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
