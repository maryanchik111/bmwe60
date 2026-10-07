import { NextResponse } from "next/server";
import { getInvoiceStatus } from "@/lib/mono";
import { markPaid } from "@/lib/donations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { invoiceId } = await req.json();
    if (typeof invoiceId !== "string") return NextResponse.json({ error: "bad body" }, { status: 400 });

    const inv = await getInvoiceStatus(invoiceId);
    if (inv.status === "success" && inv.ccy === 980) {
      await markPaid(inv.reference, inv.invoiceId, inv.amount / 100);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
