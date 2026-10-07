const API = "https://api.monobank.ua/api/merchant";

function token() {
  const t = process.env.MONO_TOKEN;
  if (!t) throw new Error("Monobank не налаштовано (див. .env.example)");
  return t;
}

export async function createInvoice(p: {
  orderId: string;
  amountUah: number;
  destination: string;
  siteUrl: string;
}): Promise<{ invoiceId: string; pageUrl: string }> {
  const res = await fetch(`${API}/invoice/create`, {
    method: "POST",
    headers: { "X-Token": token(), "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Math.round(p.amountUah * 100),
      ccy: 980,
      merchantPaymInfo: {
        reference: p.orderId,
        destination: p.destination,
        comment: p.destination,
      },
      redirectUrl: `${p.siteUrl}/?thanks=1`,
      webHookUrl: `${p.siteUrl}/api/mono/webhook`,
      validity: 3600,
    }),
  });
  if (!res.ok) throw new Error(`mono create ${res.status}: ${await res.text()}`);
  return res.json();
}

export type InvoiceStatus = {
  invoiceId: string;
  status: string;
  amount: number; // копійки
  ccy: number;
  reference: string;
};

/** Статус беремо напряму з API банку — вебхуку не довіряємо наосліп. */
export async function getInvoiceStatus(invoiceId: string): Promise<InvoiceStatus> {
  const res = await fetch(`${API}/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`, {
    headers: { "X-Token": token() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`mono status ${res.status}`);
  return res.json();
}
