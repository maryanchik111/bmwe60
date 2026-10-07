import { createHash } from "crypto";

const b64 = (s: string) => Buffer.from(s).toString("base64");
const sign = (data: string, priv: string) =>
  createHash("sha1").update(priv + data + priv).digest("base64");

function keys() {
  const pub = process.env.LIQPAY_PUBLIC_KEY;
  const priv = process.env.LIQPAY_PRIVATE_KEY;
  if (!pub || !priv) throw new Error("LiqPay не налаштовано (див. .env.example)");
  return { pub, priv };
}

export function buildCheckout(params: {
  orderId: string;
  amountUah: number;
  description: string;
  siteUrl: string;
}) {
  const { pub, priv } = keys();
  const data = b64(
    JSON.stringify({
      public_key: pub,
      version: 3,
      action: "pay",
      amount: params.amountUah,
      currency: "UAH",
      description: params.description,
      order_id: params.orderId,
      language: "uk",
      result_url: `${params.siteUrl}/?thanks=1`,
      server_url: `${params.siteUrl}/api/liqpay/callback`,
    })
  );
  return { data, signature: sign(data, priv) };
}

export type LiqpayPayment = {
  order_id: string;
  status: string;
  amount: number;
  currency: string;
};

export function verifyCallback(data: string, signature: string): LiqpayPayment | null {
  const { priv } = keys();
  if (sign(data, priv) !== signature) return null;
  return JSON.parse(Buffer.from(data, "base64").toString("utf8"));
}
