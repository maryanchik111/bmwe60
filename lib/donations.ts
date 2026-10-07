import {
  collection, doc, getDoc, getDocs, increment, limit, query, runTransaction, serverTimestamp, where,
} from "firebase/firestore";
import { db } from "./firebase";

export const GOAL_UAH = Number(process.env.NEXT_PUBLIC_GOAL_UAH || 330000);

export type Donor = { name: string; totalUah: number; count: number };
export type Supporter = {
  id: string;
  name: string;
  message: string;
  link: string;
  amountUah: number;
  paidAt: number;
};
export type Stats = {
  goalUah: number;
  raisedUah: number;
  donorsCount: number;
  top: Donor[];
  recent: Supporter[];
};

export const EMPTY_STATS: Stats = {
  goalUah: GOAL_UAH,
  raisedUah: 0,
  donorsCount: 0,
  top: [],
  recent: [],
};

export async function getStats(): Promise<Stats> {
  const firestore = db();
  const [statsDoc, paid] = await Promise.all([
    getDoc(doc(firestore, "stats", "main")),
    getDocs(query(collection(firestore, "donations"), where("status", "==", "paid"), limit(2000))),
  ]);

  const supporters: Supporter[] = paid.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      name: x.name,
      message: x.message || "",
      link: x.link || "",
      amountUah: x.amountUah,
      paidAt: x.paidAt?.toMillis?.() ?? 0,
    };
  });
  supporters.sort((a, b) => b.paidAt - a.paidAt);

  const byName = new Map<string, Donor>();
  for (const s of supporters) {
    const key = s.name.toLowerCase();
    const cur = byName.get(key) ?? { name: s.name, totalUah: 0, count: 0 };
    cur.totalUah += s.amountUah;
    cur.count += 1;
    byName.set(key, cur);
  }

  const st = statsDoc.data();
  return {
    goalUah: GOAL_UAH,
    raisedUah: st?.raisedUah ?? 0,
    donorsCount: byName.size,
    top: [...byName.values()].sort((a, b) => b.totalUah - a.totalUah).slice(0, 10),
    recent: supporters.slice(0, 30),
  };
}

/** Ідемпотентно позначає донат оплаченим і збільшує прогрес. */
export async function markPaid(orderId: string, invoiceId: string, paidUah: number) {
  const firestore = db();
  const ref = doc(firestore, "donations", orderId);
  await runTransaction(firestore, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("unknown order");
    const d = snap.data();
    if (d.status === "paid") return;
    if (d.invoiceId !== invoiceId) throw new Error("invoice mismatch");
    if (paidUah + 0.01 < d.amountUah) throw new Error("amount mismatch");
    tx.update(ref, { status: "paid", paidAt: serverTimestamp() });
    tx.set(doc(firestore, "stats", "main"), { raisedUah: increment(d.amountUah) }, { merge: true });
  });
}
