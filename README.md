# Odečty energií

Lokální webová aplikace pro evidenci odečtů energií — náhrada za ruční vedení v Excelu.

## Co umí

- Eviduje libovolný počet měřičů (elektřina, studená/teplá voda, teplo) a jejich stavy v čase.
- Spotřebu mezi dvěma odečty počítá automaticky (rozdíl proti předchozímu odečtu).
- U tepla zobrazuje **přepočet GJ → kWh** (1 GJ ≈ 277,78 kWh).
- Sazby s historií platnosti (každá s cenou za jednotku a měsíčním paušálem). Cena za období respektuje změny sazby uprostřed období.
- Dashboard se souhrnem aktuálního měsíce pro každý měřič.
- Souhrny za kalendářní rok s grafem měsíční spotřeby.
- Export všech odečtů do CSV (UTF-8 BOM, otevíratelné v Excelu CZ).

## Spuštění

Předpoklady: Node.js 20+.

```bash
npm install
npx prisma migrate deploy   # vytvoří prázdnou DB při prvním běhu
npm run db:seed             # založí 4 výchozí měřiče (přeskočí pokud existují)
npm run dev                 # http://localhost:3000
```

Pro produkční režim:

```bash
npm run build
npm start
```

## Datový soubor

Všechna data jsou v `prisma/dev.db` (SQLite). Pro zálohu stačí zkopírovat tento soubor. Soubor je `.gitignored`. Připojení k databázi je nakonfigurované v `prisma.config.ts` (Prisma 7 nepoužívá `url` v `schema.prisma`) — žádné `.env` se pro běh aplikace nevyžaduje.

## Struktura projektu

```
prisma.config.ts       # Prisma 7 konfigurace (datasource URL, cesta k migracím)
prisma/
  schema.prisma        # datový model (Meter, Reading, Tariff)
  seed.ts              # výchozí měřiče
src/
  generated/prisma/    # vygenerovaný Prisma client (gitignored)
  app/                 # Next.js App Router stránky a server actions
  components/          # MeterForm, ReadingForm, ConsumptionChart, …
  lib/
    calculations.ts    # spotřeba, cena za období, měsíční agregace
    format.ts          # cs-CZ formátování čísel, dat, jednotek
    schemas.ts         # Zod schémata pro vstupy
    db.ts              # Prisma client + better-sqlite3 adapter (singleton)
```

## Skripty

| příkaz | popis |
|---|---|
| `npm run dev` | spustí dev server |
| `npm run build` | produkční build |
| `npm start` | spustí produkční build |
| `npm test` | spustí unit testy (vitest) |
| `npm run db:migrate` | aplikuje Prisma migrace ve vývoji |
| `npm run db:seed` | založí výchozí měřiče |
| `npm run db:studio` | otevře Prisma Studio nad lokální DB |

## Pracovní postup

1. **Měřiče** — typicky se nastaví jednou (4 výchozí jsou předvyplněné).
2. **Sazby** — pro každý měřič přidej alespoň jednu sazbu s datem platnosti. Při změně ceny přidej další sazbu — historická období se přepočítají správně.
3. **Odečty** — pravidelně (2–4× měsíčně) zapisuj stav z displeje měřiče.
4. **Přehled / Souhrny** — sleduj spotřebu a odhad ceny.

## Poznámky k výpočtu

- **Spotřeba** mezi odečty = rozdíl stavů (předpokládá se kumulativní měřič).
- **Cena za období** = spotřeba × sazba + měsíční paušál × (počet dní / 30,4375). Když do období spadá změna sazby, spotřeba se mezi segmenty rozdělí lineárně podle dnů.
- **Mimo známá data** (před prvním nebo po posledním odečtu) — aplikace neextrapoluje; spotřeba je 0 v tom úseku.
