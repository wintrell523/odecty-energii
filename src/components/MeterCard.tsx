import Link from "next/link";
import {
  formatDate,
  formatNumber,
  formatPrice,
  meterTypeIcon,
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

  return (
    <article
      className="card card-accent flex flex-col gap-5"
      style={
        {
          "--accent": `var(${accent.cssVar})`,
        } as React.CSSProperties
      }
    >
      {/* Heading */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="accent-dot"
            style={{ ["--dot" as string]: `var(${accent.cssVar})` }}
            aria-hidden="true"
          />
          <h3 className="display truncate text-base">
            {meter.name}
          </h3>
        </div>
        <span className="text-xs text-ink-muted shrink-0 mt-1">
          {meterTypeIcon(meter.type)} {meterTypeLabel(meter.type)}
        </span>
      </header>

      {latest ? (
        <>
          {/* Hero number */}
          <div>
            <div className="smallcaps mb-1.5">
              Poslední stav · {formatDate(latest.date)}
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="display numerals text-ink text-4xl font-semibold leading-none">
                {formatNumber(latest.value)}
              </span>
              <span className="text-ink-soft text-base">
                {unitLabel(meter.unit)}
              </span>
            </div>
          </div>

          {/* Delta from previous */}
          {consumption != null && previous && (
            <div className="text-sm text-ink-soft">
              <span className="text-ink-muted">
                Od {formatDate(previous.date)}{" "}
              </span>
              <span className="numerals text-ink font-medium">
                +{formatNumber(consumption)} {unitLabel(meter.unit)}
              </span>
              {meter.unit === "GJ" && (
                <span className="text-ink-muted">
                  {" "}
                  · ≈ {formatNumber(gjToKwh(consumption))} kWh
                </span>
              )}
            </div>
          )}

          {/* Section divider + this-month leaders */}
          {monthConsumption != null && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 smallcaps">
                <span className="flex-1 rule-dashed" />
                <span>tento měsíc</span>
                <span className="flex-1 rule-dashed" />
              </div>

              <div className="space-y-2">
                <div className="leader">
                  <span className="text-sm text-ink-muted">spotřeba</span>
                  <span className="leader-fill" aria-hidden="true" />
                  <span className="text-sm numerals text-ink font-medium">
                    {formatNumber(monthConsumption)} {unitLabel(meter.unit)}
                  </span>
                </div>
                {monthPrice != null && (
                  <div className="leader">
                    <span className="text-sm text-ink-muted">přibližná cena</span>
                    <span className="leader-fill" aria-hidden="true" />
                    <span className="text-sm numerals text-ink font-medium">
                      {formatPrice(monthPrice)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-sm text-ink-muted">Žádné odečty zatím.</div>
      )}

      {/* Footer CTA */}
      <Link
        href={`/readings/new?meter=${meter.id}`}
        className="group mt-auto inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors w-fit"
      >
        <span>Zapsat nový odečet</span>
        <span className="inline-block transition-transform group-hover:translate-x-1">
          →
        </span>
      </Link>
    </article>
  );
}
