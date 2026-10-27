import { NextResponse } from "next/server";
import { addExpense, getExpenses, removeExpense } from "@/lib/expenses";
import { getRates } from "@/lib/rates";
import {
  CATEGORIES, CURRENCIES, PEOPLE, toUah, type Category, type Currency, type Person,
} from "@/lib/expenses-shared";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getExpenses());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Не вдалося завантажити" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const amount = Math.round(Number(b.amount) * 100) / 100;
    if (!PEOPLE.includes(b.who) || !CURRENCIES.includes(b.currency) || !CATEGORIES.includes(b.category)) {
      return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
    }
    if (!(amount > 0 && amount <= 10_000_000)) {
      return NextResponse.json({ error: "Некоректна сума" }, { status: 400 });
    }
    const rates = await getRates();
    await addExpense({
      who: b.who as Person,
      amount,
      currency: b.currency as Currency,
      amountUah: Math.round(toUah(amount, b.currency, rates) * 100) / 100,
      category: b.category as Category,
      note: String(b.note ?? "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 80),
    });
    return NextResponse.json(await getExpenses());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Не вдалося зберегти" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "no id" }, { status: 400 });
    await removeExpense(id);
    return NextResponse.json(await getExpenses());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Не вдалося видалити" }, { status: 500 });
  }
}
