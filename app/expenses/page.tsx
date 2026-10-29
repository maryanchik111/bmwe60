import type { Metadata } from "next";
import Expenses from "@/components/Expenses";
import { getExpenses } from "@/lib/expenses";
import { getRates } from "@/lib/rates";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Витрати поїздки" };

export default async function Page() {
  const data = await getExpenses().catch(async () => ({ items: [], payments: [], rates: await getRates() }));
  return <Expenses initial={data} />;
}
