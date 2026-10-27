"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft, Bed, Car, Crown, Gamepad2, ShoppingBag, Trash2, Utensils, Wallet, Plus, Shapes,
} from "lucide-react";
import {
  CATEGORIES, CURRENCIES, PEOPLE, fromUah, toUah,
  type Category, type Currency, type ExpensesData, type Person,
} from "@/lib/expenses-shared";

const COLORS: Record<Person, string> = {
  Богдана: "#ec4899",
  Назар: "#f97316",
  Марян: "#1c4fe4",
  Тіна: "#10b981",
};
const CAT_ICON: Record<Category, typeof Utensils> = {
  Їжа: Utensils,
  Транспорт: Car,
  Житло: Bed,
  Розваги: Gamepad2,
  Покупки: ShoppingBag,
  Інше: Shapes,
};
const SYMBOL: Record<Currency, string> = { UAH: "₴", USD: "$", PLN: "zł" };

const card = "rounded-[28px] bg-white p-6 sm:p-8 shadow-[0_4px_0_0_#d9d8d4]";
const field =
  "w-full rounded-2xl border-2 border-ink/10 bg-paper px-4 py-3 font-medium outline-none transition focus:border-brand placeholder:text-ink/35";

export default function Expenses({ initial }: { initial: ExpensesData }) {
  const [data, setData] = useState(initial);
  const [view, setView] = useState<Currency>("UAH");
  const [who, setWho] = useState<Person>(PEOPLE[0]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("PLN");
  const [category, setCategory] = useState<Category>("Їжа");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const { items, rates } = data;
  const money = (uah: number, cur: Currency = view) => {
    const v = fromUah(uah, cur, rates);
    const s = v.toLocaleString("uk-UA", { maximumFractionDigits: cur === "UAH" ? 0 : 2 });
    return cur === "UAH" ? `${s} ₴` : cur === "USD" ? `$${s}` : `${s} zł`;
  };

  const stats = useMemo(() => {
    const total = items.reduce((s, e) => s + e.amountUah, 0);
    const byPerson = PEOPLE.map((p) => ({
      name: p,
      uah: items.filter((e) => e.who === p).reduce((s, e) => s + e.amountUah, 0),
      count: items.filter((e) => e.who === p).length,
    }));
    const byCat = CATEGORIES.map((c) => ({
      name: c,
      uah: items.filter((e) => e.category === c).reduce((s, e) => s + e.amountUah, 0),
    })).filter((c) => c.uah > 0).sort((a, b) => b.uah - a.uah);

    const days = new Map<string, Record<Person, number>>();
    for (const e of items) {
      const k = new Date(e.at).toLocaleDateString("sv-SE");
      const row = days.get(k) ?? ({ Богдана: 0, Назар: 0, Марян: 0, Тіна: 0 } as Record<Person, number>);
      row[e.who] += e.amountUah;
      days.set(k, row);
    }
    const timeline = [...days.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-14);
    return { total, byPerson, byCat, timeline, share: total / PEOPLE.length };
  }, [items]);

  const top = stats.byPerson.reduce((a, b) => (b.uah > a.uah ? b : a), stats.byPerson[0]);

  async function call(init?: RequestInit, qs = "") {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/expenses${qs}`, init);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setData(j);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    const n = Number(amount.replace(",", "."));
    if (!(n > 0)) return setError("Введи суму");
    const ok = await call({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ who, amount: n, currency, category, note }),
    });
    if (ok) {
      setAmount("");
      setNote("");
    }
  }

  const preview = Number(amount.replace(",", "."));

  // donut
  const R = 70, C = 2 * Math.PI * R;
  let offset = 0;

  const maxDay = Math.max(1, ...stats.timeline.map(([, r]) => PEOPLE.reduce((s, p) => s + r[p], 0)));

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20">
      <nav className="flex items-center justify-between pt-8">
        <a href="/" className="flex items-center gap-2 font-bold text-ink/60 hover:text-ink">
          <ArrowLeft size={18} /> На головну
        </a>
        <div className="flex rounded-full bg-white p-1 shadow-[0_3px_0_0_#d9d8d4]">
          {CURRENCIES.map((c) => (
            <button key={c} onClick={() => setView(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${view === c ? "bg-ink text-white" : "text-ink/60"}`}>
              {c}
            </button>
          ))}
        </div>
      </nav>

      <header className="pb-8 pt-10">
        <h1 className="text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
          Витрати{" "}
          <span className="inline-block -rotate-1 rounded-xl bg-brand px-3 text-white">поїздки</span>
        </h1>
        <p className="mt-4 text-lg text-ink/60">Хто скільки витратив і хто кому винен.</p>
      </header>

      <div className="space-y-6">
        <section className={card}>
          <div className="text-sm font-bold uppercase tracking-wide text-ink/40">Всього витрачено</div>
          <div className="mt-1 text-5xl font-black tracking-tight sm:text-6xl">{money(stats.total)}</div>
          <div className="mt-2 flex flex-wrap gap-x-5 text-sm font-semibold text-ink/50">
            {CURRENCIES.filter((c) => c !== view).map((c) => <span key={c}>≈ {money(stats.total, c)}</span>)}
            <span>на кожного {money(stats.share)}</span>
          </div>
          <p className="mt-2 text-xs text-ink/30">
            Курс НБУ: 1 $ = {rates.USD.toFixed(2)} ₴ · 1 zł = {rates.PLN.toFixed(2)} ₴. Сума в гривні
            фіксується в момент запису.
          </p>
        </section>

        <section className={card}>
          <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight">
            <Plus className="text-brand" /> Додати витрату
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {PEOPLE.map((p) => (
              <button key={p} onClick={() => setWho(p)}
                className={`rounded-full px-5 py-2 font-bold transition ${who === p ? "text-white" : "bg-paper text-ink/60"}`}
                style={who === p ? { background: COLORS[p] } : undefined}>
                {p}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input className={field} inputMode="decimal" placeholder="Сума" value={amount}
              onChange={(e) => setAmount(e.target.value)} />
            <div className="flex rounded-2xl bg-paper p-1">
              {CURRENCIES.map((c) => (
                <button key={c} onClick={() => setCurrency(c)}
                  className={`flex-1 rounded-xl px-5 font-bold transition ${currency === c ? "bg-ink text-white" : "text-ink/50"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          {preview > 0 && currency !== "UAH" && (
            <p className="mt-2 text-sm font-semibold text-ink/50">
              ≈ {Math.round(toUah(preview, currency, rates)).toLocaleString("uk-UA")} ₴
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const Icon = CAT_ICON[c];
              return (
                <button key={c} onClick={() => setCategory(c)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${category === c ? "bg-ink text-white" : "bg-paper text-ink/60"}`}>
                  <Icon size={16} /> {c}
                </button>
              );
            })}
          </div>
          <input className={`${field} mt-3`} placeholder="Нотатка (необов’язково): піца, таксі…" maxLength={80}
            value={note} onChange={(e) => setNote(e.target.value)} />
          <button disabled={busy} onClick={add}
            className="mt-4 w-full rounded-full bg-ink py-4 text-lg font-bold text-white shadow-[0_5px_0_0_#1c4fe4] transition active:translate-y-1 active:shadow-none disabled:opacity-50">
            {busy ? "…" : "Додати"}
          </button>
          {error && <p className="mt-3 font-semibold text-red-600">{error}</p>}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={card}>
            <h2 className="text-2xl font-black tracking-tight">Хто скільки</h2>
            <div className="mt-5 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="h-48 w-48 -rotate-90">
                <circle cx="100" cy="100" r={R} fill="none" stroke="#f3f2ef" strokeWidth="28" />
                {stats.total > 0 &&
                  stats.byPerson.map((p) => {
                    const len = (p.uah / stats.total) * C;
                    const el = (
                      <circle key={p.name} cx="100" cy="100" r={R} fill="none" stroke={COLORS[p.name]}
                        strokeWidth="28" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />
                    );
                    offset += len;
                    return el;
                  })}
              </svg>
            </div>
            <ul className="mt-5 space-y-3">
              {[...stats.byPerson].sort((a, b) => b.uah - a.uah).map((p) => (
                <li key={p.name}>
                  <div className="flex items-center justify-between gap-2 font-bold">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ background: COLORS[p.name] }} />
                      {p.name}
                      {stats.total > 0 && p.name === top.name && top.uah > 0 && (
                        <Crown size={16} className="fill-yellow-400 text-yellow-500" />
                      )}
                    </span>
                    <span>{money(p.uah)}</span>
                  </div>
                  <div className="mt-1 h-3 overflow-hidden rounded-full bg-paper">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${stats.total ? (p.uah / stats.total) * 100 : 0}%`, background: COLORS[p.name] }} />
                  </div>
                  <div className="mt-1 text-xs font-semibold text-ink/40">
                    {stats.total ? Math.round((p.uah / stats.total) * 100) : 0}% · {p.count} витрат
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-6">
            <section className={card}>
              <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight">
                <Wallet className="text-brand" /> Баланс
              </h2>
              <p className="mt-1 text-sm text-ink/50">Якщо ділити порівну ({money(stats.share)} на людину)</p>
              <ul className="mt-4 space-y-2">
                {stats.byPerson.map((p) => {
                  const diff = p.uah - stats.share;
                  return (
                    <li key={p.name} className="flex items-center justify-between rounded-2xl bg-paper px-4 py-2.5 font-bold">
                      <span>{p.name}</span>
                      <span className={diff >= 0 ? "text-emerald-600" : "text-red-500"}>
                        {diff >= 0 ? "+" : "−"}{money(Math.abs(diff))}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-ink/40">Плюс — комусь мають повернути, мінус — треба доплатити.</p>
            </section>

            <section className={card}>
              <h2 className="text-2xl font-black tracking-tight">На що йдуть гроші</h2>
              <ul className="mt-4 space-y-3">
                {stats.byCat.length === 0 && <li className="font-medium text-ink/40">Поки порожньо.</li>}
                {stats.byCat.map((c) => {
                  const Icon = CAT_ICON[c.name];
                  return (
                    <li key={c.name}>
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-2"><Icon size={18} className="text-brand" /> {c.name}</span>
                        <span>{money(c.uah)}</span>
                      </div>
                      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-paper">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${(c.uah / stats.total) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>

        {stats.timeline.length > 0 && (
          <section className={card}>
            <h2 className="text-2xl font-black tracking-tight">По днях</h2>
            <div className="mt-5 flex h-48 items-end gap-2 overflow-x-auto">
              {stats.timeline.map(([day, row]) => {
                const sum = PEOPLE.reduce((s, p) => s + row[p], 0);
                return (
                  <div key={day} className="flex min-w-[36px] flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-[10px] font-bold text-ink/40">{money(sum)}</span>
                    <div className="flex w-full flex-col-reverse overflow-hidden rounded-lg"
                      style={{ height: `${(sum / maxDay) * 130}px`, minHeight: 4 }}>
                      {PEOPLE.map((p) => row[p] > 0 && (
                        <div key={p} style={{ height: `${(row[p] / sum) * 100}%`, background: COLORS[p] }} />
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold text-ink/40">{day.slice(5).replace("-", ".")}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-ink/60">
              {PEOPLE.map((p) => (
                <span key={p} className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full" style={{ background: COLORS[p] }} /> {p}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className={card}>
          <h2 className="text-2xl font-black tracking-tight">Усі витрати</h2>
          <ul className="mt-4 space-y-2">
            {items.length === 0 && <li className="font-medium text-ink/40">Ще нічого не додано.</li>}
            {items.map((e) => {
              const Icon = CAT_ICON[e.category] ?? Shapes;
              return (
                <li key={e.id} className="flex items-center gap-3 rounded-2xl bg-paper px-4 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white"
                    style={{ background: COLORS[e.who] }}>
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{e.who}{e.note && <span className="font-medium text-ink/50"> · {e.note}</span>}</div>
                    <div className="text-xs font-medium text-ink/40">
                      {new Date(e.at).toLocaleDateString("uk-UA", { day: "numeric", month: "short" })} · {e.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold">{e.amount.toLocaleString("uk-UA")} {SYMBOL[e.currency]}</div>
                    {e.currency !== "UAH" && (
                      <div className="text-xs font-medium text-ink/40">≈ {Math.round(e.amountUah).toLocaleString("uk-UA")} ₴</div>
                    )}
                  </div>
                  <button aria-label="Видалити" disabled={busy}
                    onClick={() => confirm("Видалити цю витрату?") && call({ method: "DELETE" }, `?id=${e.id}`)}
                    className="rounded-full p-2 text-ink/30 transition hover:bg-white hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
