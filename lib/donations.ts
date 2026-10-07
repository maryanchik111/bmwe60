import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase";

export const GOAL_USD = Number(process.env.NEXT_PUBLIC_GOAL_USD || 8000);

export type Donor = { name: string; totalUsd: number; count: number };
export type Supporter = {
  id: string;
  name: string;
  message: string;
  link: string;
  amountUsd: number;
  paidAt: number;
};
export type Stats = {
  goalUsd: number;
  raisedUsd: number;
  donorsCount: number;
  top: Donor[];
  recent: Supporter[];
};

export const EMPTY_STATS: Stats = {
  goalUsd: GOAL_USD,
  raisedUsd: 0,
  donorsCount: 0,
  top: [],
  recent: [],
};

export async function getStats(): Promise<Stats> {
  const firestore = db();
  const [statsDoc, paid] = await Promise.all([
    firestore.doc("stats/main").get(),
    firestore.collection("donations").where("status", "==", "paid").limit(2000).get(),
  ]);

  const supporters: Supporter[] = paid.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      name: x.name,
      message: x.message || "",
      link: x.link || "",
      amountUsd: x.amountUsd,
      paidAt: x.paidAt?.toMillis?.() ?? 0,
    };
  });
  supporters.sort((a, b) => b.paidAt - a.paidAt);

  const byName = new Map<string, Donor>();
  for (const s of supporters) {
    const key = s.name.toLowerCase();
    const cur = byName.get(key) ?? { name: s.name, totalUsd: 0, count: 0 };
    cur.totalUsd += s.amountUsd;
    cur.count += 1;
    byName.set(key, cur);
  }

  const st = statsDoc.data();
  return {
    goalUsd: GOAL_USD,
    raisedUsd: st?.raisedUsd ?? 0,
    donorsCount: byName.size,
    top: [...byName.values()].sort((a, b) => b.totalUsd - a.totalUsd).slice(0, 10),
    recent: supporters.slice(0, 30),
  };
}

/** Ідемпотентно позначає донат оплаченим і збільшує прогрес. */
export async function markPaid(orderId: string, invoiceId: string, paidUah: number) {
  const firestore = db();
  const ref = firestore.collection("donations").doc(orderId);
  await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error("unknown order");
    const d = snap.data()!;
    if (d.status === "paid") return;
    if (d.invoiceId !== invoiceId) throw new Error("invoice mismatch");
    if (paidUah + 0.01 < d.amountUah) throw new Error("amount mismatch");
    tx.update(ref, { status: "paid", paidAt: FieldValue.serverTimestamp() });
    tx.set(
      firestore.doc("stats/main"),
      { raisedUsd: FieldValue.increment(d.amountUsd) },
      { merge: true }
    );
  });
}
