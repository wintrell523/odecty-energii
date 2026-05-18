"use client";

import { useActionState } from "react";
import {
  createMeter,
  updateMeter,
  type MeterActionResult,
} from "@/app/actions/meters";
import type { MeterType, Unit } from "@/lib/format";
import { meterTypeLabel, unitLabel } from "@/lib/format";

type Props = {
  initial?: {
    id: number;
    name: string;
    type: MeterType;
    unit: Unit;
    active: boolean;
  };
  onSuccess?: () => void;
};

const TYPES: MeterType[] = ["ELECTRICITY", "COLD_WATER", "HOT_WATER", "HEAT"];
const UNITS: Unit[] = ["KWH", "M3", "GJ"];

export default function MeterForm({ initial, onSuccess }: Props) {
  const action = initial ? updateMeter.bind(null, initial.id) : createMeter;
  const [state, formAction, pending] = useActionState<
    MeterActionResult | null,
    FormData
  >(action, null);

  if (state?.ok && onSuccess) {
    queueMicrotask(onSuccess);
  }

  const err = (k: string) =>
    state && !state.ok ? state.errors[k] : undefined;

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="field-label" htmlFor="name">
          Název
        </label>
        <input
          id="name"
          name="name"
          defaultValue={initial?.name ?? ""}
          placeholder="např. Elektřina domácnost"
          required
        />
        {err("name") && <div className="field-error">{err("name")}</div>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="field-label" htmlFor="type">
            Typ energie
          </label>
          <select
            id="type"
            name="type"
            defaultValue={initial?.type ?? "ELECTRICITY"}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {meterTypeLabel(t)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="unit">
            Jednotka
          </label>
          <select id="unit" name="unit" defaultValue={initial?.unit ?? "KWH"}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {unitLabel(u)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm text-ink-soft cursor-pointer">
        <input
          type="checkbox"
          name="active"
          defaultChecked={initial ? initial.active : true}
        />
        <span>Aktivní (zobrazuje se na přehledu)</span>
      </label>
      <div className="flex gap-2 pt-2">
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Ukládám…" : initial ? "Uložit" : "Přidat měřič"}
        </button>
      </div>
    </form>
  );
}
