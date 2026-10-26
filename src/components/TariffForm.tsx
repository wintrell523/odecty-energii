"use client";

import { useActionState, useEffect } from "react";
import { useCloseModal } from "@/components/Modal";
import {
  createTariff,
  updateTariff,
  type TariffActionResult,
} from "@/app/actions/tariffs";
import {
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
    validFrom: Date;
    unitPrice: number;
    monthlyFee: number;
    note: string | null;
  };
};

export default function TariffForm({ meters, initial }: Props) {
  const action = initial ? updateTariff.bind(null, initial.id) : createTariff;
  const [state, formAction, pending] = useActionState<
    TariffActionResult | null,
    FormData
  >(action, null);
  const closeModal = useCloseModal();
  useEffect(() => {
    if (state?.ok) closeModal?.();
  }, [state, closeModal]);
  const err = (k: string) =>
    state && !state.ok ? state.errors[k] : undefined;

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="field-label" htmlFor="meterId">
          Měřič
        </label>
        <select
          id="meterId"
          name="meterId"
          defaultValue={initial?.meterId}
          required
        >
          {meters.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({meterTypeLabel(m.type)},{" "}
              {unitLabel(m.unit)})
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="field-label" htmlFor="validFrom">
            Platnost od
          </label>
          <input
            type="date"
            id="validFrom"
            name="validFrom"
            defaultValue={toIsoDate(initial?.validFrom ?? new Date())}
            required
          />
          {err("validFrom") && (
            <div className="field-error">{err("validFrom")}</div>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="unitPrice">
            Cena za jednotku (Kč)
          </label>
          <input
            id="unitPrice"
            name="unitPrice"
            inputMode="decimal"
            placeholder="např. 6,50"
            defaultValue={initial?.unitPrice.toString().replace(".", ",")}
            className="numerals"
            required
          />
          {err("unitPrice") && (
            <div className="field-error">{err("unitPrice")}</div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="field-label" htmlFor="monthlyFee">
            Měsíční paušál (Kč)
          </label>
          <input
            id="monthlyFee"
            name="monthlyFee"
            inputMode="decimal"
            defaultValue={initial?.monthlyFee.toString().replace(".", ",") ?? "0"}
            className="numerals"
          />
          {err("monthlyFee") && (
            <div className="field-error">{err("monthlyFee")}</div>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="note">
            Poznámka
          </label>
          <input
            id="note"
            name="note"
            placeholder="např. Změna od ledna"
            defaultValue={initial?.note ?? ""}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Ukládám…" : initial ? "Uložit změny" : "Přidat sazbu"}
        </button>
        {closeModal && (
          <button type="button" className="btn btn-secondary" onClick={closeModal}>
            Zrušit
          </button>
        )}
      </div>
    </form>
  );
}
