import type { Rates } from "./expenses-shared";

let cache: { rates: Rates; at: number } | null = null;

/** Курси НБУ: гривень за 1 USD і 1 PLN (кеш на годину). */
export async function getRates(): Promise<Rates> {
  if (cache && Date.now() - cache.at < 3600_000) return cache.rates;
  try {
    const res = await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json", {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    const data = (await res.json()) as { cc: string; rate: number }[];
    const USD = data.find((x) => x.cc === "USD")?.rate;
    const PLN = data.find((x) => x.cc === "PLN")?.rate;
    if (USD && PLN) {
      cache = { rates: { USD, PLN }, at: Date.now() };
      return cache.rates;
    }
  } catch {}
  return cache?.rates ?? { USD: 41.5, PLN: 11.5 };
}
