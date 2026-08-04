import { z } from "zod";
import { isIsoDate } from "./format";

export function zodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export const meterTypeEnum = z.enum(["ELECTRICITY", "COLD_WATER", "HOT_WATER", "HEAT"]);
export const unitEnum = z.enum(["KWH", "M3", "GJ"]);

export const meterInput = z.object({
  name: z.string().min(1, "Název je povinný").max(80),
  type: meterTypeEnum,
  unit: unitEnum,
  active: z.boolean().default(true),
});
export type MeterInput = z.infer<typeof meterInput>;

const numeric = z
  .string()
  .trim()
  .min(1, "Hodnota je povinná")
  .transform((s, ctx) => {
    const n = Number(s.replace(",", "."));
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: "custom", message: "Neplatné číslo" });
      return z.NEVER;
    }
    if (n < 0) {
      ctx.addIssue({ code: "custom", message: "Musí být ≥ 0" });
      return z.NEVER;
    }
    return n;
  });

const isoDate = z
  .string()
  .trim()
  .min(1, "Datum je povinné")
  .refine(isIsoDate, "Neplatné datum");

export const readingInput = z.object({
  meterId: z.coerce.number().int().positive(),
  date: isoDate,
  value: numeric,
  note: z.string().max(200).optional().or(z.literal("")),
});
export type ReadingInput = z.infer<typeof readingInput>;

export const tariffInput = z.object({
  meterId: z.coerce.number().int().positive(),
  validFrom: isoDate,
  unitPrice: numeric,
  monthlyFee: numeric.optional(),
  note: z.string().max(200).optional().or(z.literal("")),
});
export type TariffInput = z.infer<typeof tariffInput>;
