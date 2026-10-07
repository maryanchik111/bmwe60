import Fund from "@/components/Fund";
import { EMPTY_STATS, getStats } from "@/lib/donations";
import { usdToUah } from "@/lib/rate";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [stats, rate] = await Promise.all([
    getStats().catch(() => EMPTY_STATS),
    usdToUah(),
  ]);
  return <Fund initial={stats} rate={rate} />;
}
