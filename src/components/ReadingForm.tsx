"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createReading,
  updateReading,
  type ReadingActionResult,
} from "@/app/actions/readings";
import {
  meterTypeIcon,
  meterTypeLabel,
  toIsoDate,
  unitLabel,
  type MeterType,
  type Unit,
} from "@/lib/format";

type Meter = { id: number; name: string; type: MeterType; unit: Unit };

type Props = {
  meters: Meter[];
  initial?: {
    id: number;
    meterId: number;
    date: Date;
    value: number;
    note: string | null;
  };
  defaultMeterId?: number;
  redirectTo?: string;
  closeOnSuccess?: boolean;
};

export default function ReadingForm({
  meters,
  initial,
  defaultMeterId,
  redirectTo,
  closeOnSuccess = false,
}: Props) {
  const router = useRouter();
  const meterSelect = useRef<HTMLSelectElement>(null);
  const action = initial ? updateReading.bind(null, initial.id) : createReading;
  const [state, formAction, pending] = useActionState<
    ReadingActionResult | null,
    FormData
  >(action, null);

  useEffect(() => {
    if (initial || defaultMeterId != null) return;
    try {
      const savedMeter = localStorage.getItem("last-reading-meter");
      if (meterSelect.current && meters.some((m) => String(m.id) === savedMeter)) {
        meterSelect.current.value = savedMeter!;
      }
    } catch {
      // The form still works when browser storage is blocked.
    }
  }, [initial, defaultMeterId, meters]);

  useEffect(() => {
    if (!state?.ok) return;
    if (closeOnSuccess) router.back();
    else if (redirectTo) router.push(redirectTo);
  }, [state, redirectTo, closeOnSuccess, router]);

  const err = (k: string) =>
    state && !state.ok ? state.errors[k] : undefined;

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label className="field-label" htmlFor="meterId">
          Měřič
        </label>
        <select
          ref={meterSelect}
          id="meterId"
          name="meterId"
          defaultValue={initial?.meterId ?? defaultMeterId ?? meters[0]?.id}
          onChange={(event) => {
            if (initial) return;
            try {
              localStorage.setItem("last-reading-meter", event.currentTarget.value);
            } catch {
              // Remembering the meter is optional when browser storage is blocked.
            }
          }}
          required
        >
          {meters.map((m) => (
            <option key={m.id} value={m.id}>
              {meterTypeIcon(m.type)} {m.name} ({meterTypeLabel(m.type)},{" "}
              {unitLabel(m.unit)})
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="field-label" htmlFor="date">
            Datum odečtu
          </label>
          <input
            type="date"
            id="date"
            name="date"
            defaultValue={
              initial ? toIsoDate(initial.date) : toIsoDate(new Date())
            }
            required
          />
          {err("date") && <div className="field-error">{err("date")}</div>}
        </div>
        <div>
          <label className="field-label" htmlFor="value">
            Stav měřiče
          </label>
          <input
            id="value"
            name="value"
            inputMode="decimal"
            placeholder="opiš číslo z měřiče"
            defaultValue={initial?.value.toString().replace(".", ",") ?? ""}
            className="numerals"
            required
          />
          {err("value") && <div className="field-error">{err("value")}</div>}
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="note">
          Poznámka
        </label>
        <input
          id="note"
          name="note"
          placeholder="volitelné"
          defaultValue={initial?.note ?? ""}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button className="btn btn-primary" disabled={pending}>
          {pending
            ? "Ukládám…"
            : initial
              ? "Uložit změny"
              : "Zapsat odečet"}
        </button>
        {(redirectTo || closeOnSuccess) && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => closeOnSuccess ? router.back() : router.replace(redirectTo!)}
          >
            Zrušit
          </button>
        )}
      </div>
    </form>
  );
}
