import {
  addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getRates } from "./rates";
import type { Expense, ExpensesData } from "./expenses-shared";

export async function getExpenses(): Promise<ExpensesData> {
  const [snap, rates] = await Promise.all([
    getDocs(query(collection(db(), "expenses"), orderBy("createdAt", "desc"), limit(1000))),
    getRates(),
  ]);
  const items: Expense[] = snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      who: x.who,
      amount: x.amount,
      currency: x.currency,
      amountUah: x.amountUah,
      note: x.note || "",
      category: x.category,
      at: x.createdAt?.toMillis?.() ?? Date.now(),
    };
  });
  return { items, rates };
}

export async function addExpense(e: Omit<Expense, "id" | "at">) {
  await addDoc(collection(db(), "expenses"), { ...e, createdAt: serverTimestamp() });
}

export async function removeExpense(id: string) {
  await deleteDoc(doc(db(), "expenses", id));
}
