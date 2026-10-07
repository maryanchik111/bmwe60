import Fund from "@/components/Fund";
import { EMPTY_STATS, getStats } from "@/lib/donations";

export const dynamic = "force-dynamic";

export default async function Page() {
  const stats = await getStats().catch(() => EMPTY_STATS);
  return <Fund initial={stats} />;
}
