import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createInvoice } from "@/lib/mono";

export const dynamic = "force-dynamic";

const clean = (v: unknown, max: number) =>
  String(v ?? "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

function cleanLink(v: unknown) {
  const raw = String(v ?? "").trim();
  if (!raw) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString().slice(0, 200) : "";
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const amountUah = Math.round(Number(body.amountUah) * 100) / 100;
    if (!(amountUah >= 10 && amountUah <= 200000)) {
      return NextResponse.json({ error: "Сума має бути від 10 до 200 000 ₴" }, { status: 400 });
    }
    const name = clean(body.name, 30) || "Анонім";
    const message = clean(body.message, 160);
    const link = message ? cleanLink(body.link) : "";

    const orderId = randomUUID();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, "");

    const invoice = await createInvoice({
      orderId,
      amountUah,
      destination: `Донат на BMW E60 від ${name}`,
      siteUrl,
    });

    await setDoc(doc(db(), "donations", orderId), {
      name,
      message,
      link,
      amountUah,
      invoiceId: invoice.invoiceId,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ url: invoice.pageUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Не вдалося створити платіж" }, { status: 500 });
  }
}
