let cache: { rate: number; at: number } | null = null;

/** Курс НБУ: скільки гривень за 1 USD (кеш на годину). */
export async function usdToUah(): Promise<number> {
  if (cache && Date.now() - cache.at < 3600_000) return cache.rate;
  try {
    const res = await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json", {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    const data = (await res.json()) as { rate: number }[];
    const rate = Number(data[0]?.rate);
    if (rate > 0) {
      cache = { rate, at: Date.now() };
      return rate;
    }
  } catch {}
  return cache?.rate ?? Number(process.env.FALLBACK_USD_UAH || 41.5);
}
