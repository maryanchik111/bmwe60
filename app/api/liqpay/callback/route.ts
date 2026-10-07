import { NextResponse } from "next/server";
import { verifyCallback } from "@/lib/liqpay";
import { markPaid } from "@/lib/donations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  const payment = verifyCallback(String(form.get("data") ?? ""), String(form.get("signature") ?? ""));
  if (!payment) return NextResponse.json({ error: "bad signature" }, { status: 400 });

  if (payment.currency === "UAH" && ["success", "sandbox"].includes(payment.status)) {
    try {
      await markPaid(payment.order_id, Number(payment.amount));
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "failed" }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
