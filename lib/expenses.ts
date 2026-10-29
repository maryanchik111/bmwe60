import {
  addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getRates } from "./rates";
import type { Expense, ExpensesData, Payment } from "./expenses-shared";

export async function getExpenses(): Promise<ExpensesData> {
  const [snap, paySnap, rates] = await Promise.all([
    getDocs(query(collection(db(), "expenses"), orderBy("createdAt", "desc"), limit(1000))),
    getDocs(query(collection(db(), "payments"), orderBy("createdAt", "desc"), limit(1000))),
    getRates(),
  ]);
  const payments: Payment[] = paySnap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      from: x.from,
      to: x.to,
      amount: x.amount,
      currency: x.currency,
      amountUah: x.amountUah,
      at: x.createdAt?.toMillis?.() ?? Date.now(),
    };
  });
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
  return { items, payments, rates };
}

export async function addExpense(e: Omit<Expense, "id" | "at">) {
  await addDoc(collection(db(), "expenses"), { ...e, createdAt: serverTimestamp() });
}

export async function removeExpense(id: string) {
  await deleteDoc(doc(db(), "expenses", id));
}

export async function addPayment(p: Omit<Payment, "id" | "at">) {
  await addDoc(collection(db(), "payments"), { ...p, createdAt: serverTimestamp() });
}

export async function removePayment(id: string) {
  await deleteDoc(doc(db(), "payments", id));
}
