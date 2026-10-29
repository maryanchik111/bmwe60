import { NextResponse } from "next/server";
import { addPayment, getExpenses, removePayment } from "@/lib/expenses";
import { getRates } from "@/lib/rates";
import { CURRENCIES, PEOPLE, toUah, type Currency, type Person } from "@/lib/expenses-shared";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const amount = Math.round(Number(b.amount) * 100) / 100;
    if (!PEOPLE.includes(b.from) || !PEOPLE.includes(b.to) || b.from === b.to || !CURRENCIES.includes(b.currency)) {
      return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
    }
    if (!(amount > 0 && amount <= 10_000_000)) {
      return NextResponse.json({ error: "Некоректна сума" }, { status: 400 });
    }
    const rates = await getRates();
    await addPayment({
      from: b.from as Person,
      to: b.to as Person,
      amount,
      currency: b.currency as Currency,
      amountUah: Math.round(toUah(amount, b.currency, rates) * 100) / 100,
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
    await removePayment(id);
    return NextResponse.json(await getExpenses());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Не вдалося видалити" }, { status: 500 });
  }
}
