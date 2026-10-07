import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase";
import { usdToUah } from "@/lib/rate";
import { buildCheckout } from "@/lib/liqpay";

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
    const amountUsd = Math.round(Number(body.amountUsd) * 100) / 100;
    if (!(amountUsd >= 1 && amountUsd <= 5000)) {
      return NextResponse.json({ error: "Сума має бути від $1 до $5000" }, { status: 400 });
    }
    const name = clean(body.name, 30) || "Анонім";
    const message = clean(body.message, 160);
    const link = message ? cleanLink(body.link) : "";

    const rate = await usdToUah();
    const amountUah = Math.ceil(amountUsd * rate);
    const orderId = randomUUID();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, "");

    const checkout = buildCheckout({
      orderId,
      amountUah,
      description: `Донат на BMW E60 від ${name}`,
      siteUrl,
    });

    await db().collection("donations").doc(orderId).set({
      name,
      message,
      link,
      amountUsd,
      amountUah,
      rate,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ...checkout, url: "https://www.liqpay.ua/api/3/checkout" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Не вдалося створити платіж" }, { status: 500 });
  }
}
