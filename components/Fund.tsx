"use client";

import { useEffect, useRef, useState } from "react";
import type { Stats } from "@/lib/donations";

const PRESETS = [5, 10, 25, 50, 100];

const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const uah = (n: number) => `${Math.round(n).toLocaleString("uk-UA")} ₴`;

function ago(ms: number) {
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return "щойно";
  if (m < 60) return `${m} хв тому`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} год тому`;
  return `${Math.floor(h / 24)} дн тому`;
}

export default function Fund({ initial, rate }: { initial: Stats; rate: number }) {
  const [stats, setStats] = useState(initial);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [thanks, setThanks] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const t = new URLSearchParams(location.search).get("thanks");
    if (t) {
      setThanks(true);
      history.replaceState(null, "", "/");
    }
    const load = () =>
      fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => {});
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const pct = Math.min(100, (stats.raisedUsd / stats.goalUsd) * 100);

  async function donate(amountUsd: number) {
    setError("");
    if (!(amountUsd >= 1)) return setError("Мінімальна сума — $1");
    setBusy(amountUsd);
    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd, name, message, link }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      const f = formRef.current!;
      (f.elements.namedItem("data") as HTMLInputElement).value = j.data;
      (f.elements.namedItem("signature") as HTMLInputElement).value = j.signature;
      f.action = j.url;
      f.submit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка, спробуй ще раз");
      setBusy(null);
    }
  }

  const input =
    "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-bmw-light placeholder:text-white/30";

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24">
      <form ref={formRef} method="POST" acceptCharset="utf-8" className="hidden">
        <input name="data" /> <input name="signature" />
      </form>

      <header className="pt-16 pb-10 text-center">
        <div className="mx-auto mb-5 flex w-fit gap-1">
          <span className="h-1.5 w-10 rounded bg-bmw-blue" />
          <span className="h-1.5 w-10 rounded bg-indigo-800" />
          <span className="h-1.5 w-10 rounded bg-red-600" />
        </div>
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
          Збираю на <span className="text-bmw-light">BMW E60</span> 3.0d
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-white/60">
          Шестициліндровий дизель, 530d. Допоможи мені її купити — а я покажу на сайті твоє
          повідомлення або посилання всім, хто сюди зайде. 🚗💨
        </p>
      </header>

      {thanks && (
        <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
          Дякую за підтримку! 🙌 Після підтвердження платежу ти з’явишся в списку нижче.
        </div>
      )}

      {/* Progress */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="text-5xl font-black">{usd(stats.raisedUsd)}</div>
            <div className="text-white/50">{uah(stats.raisedUsd * rate)} зібрано</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">з {usd(stats.goalUsd)}</div>
            <div className="text-white/50">{uah(stats.goalUsd * rate)}</div>
          </div>
        </div>
        <div className="mt-5 h-5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-bmw-blue to-bmw-light transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-sm text-white/60">
          <span>{pct.toFixed(1)}%</span>
          <span>👥 {stats.donorsCount} {stats.donorsCount === 1 ? "учасник" : "учасників"}</span>
          <span>Лишилось {usd(Math.max(0, stats.goalUsd - stats.raisedUsd))}</span>
        </div>
        <p className="mt-2 text-xs text-white/30">Курс НБУ: 1 $ = {rate.toFixed(2)} ₴</p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Donate */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-3">
          <h2 className="text-2xl font-bold">Приєднатись</h2>
          <p className="mt-1 text-sm text-white/50">
            Натисни суму — одразу перейдеш до оплати карткою, Apple/Google Pay (LiqPay).
          </p>

          <div className="mt-5 grid gap-3">
            <input className={input} placeholder="Твій нік (необов’язково)" maxLength={30}
              value={name} onChange={(e) => setName(e.target.value)} />
            <textarea className={input} rows={2} maxLength={160}
              placeholder="Твоя реклама / повідомлення — з’явиться на сайті (до 160 символів)"
              value={message} onChange={(e) => setMessage(e.target.value)} />
            {message && (
              <input className={input} placeholder="Посилання (сайт, Instagram, Telegram…)"
                value={link} onChange={(e) => setLink(e.target.value)} />
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {PRESETS.map((p) => (
              <button key={p} disabled={busy !== null} onClick={() => donate(p)}
                className="rounded-xl bg-bmw-blue py-3 text-center font-bold transition hover:bg-bmw-light active:scale-95 disabled:opacity-50">
                {busy === p ? "…" : usd(p)}
                <div className="text-xs font-normal text-white/70">{uah(p * rate)}</div>
              </button>
            ))}
          </div>

          <div className="mt-3 flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-3.5 text-white/40">$</span>
              <input className={`${input} pl-8`} type="number" min={1} max={5000} placeholder="Своя сума"
                value={custom} onChange={(e) => setCustom(e.target.value)} />
            </div>
            <button disabled={busy !== null} onClick={() => donate(Number(custom))}
              className="rounded-xl bg-white px-6 font-bold text-black transition hover:bg-white/80 disabled:opacity-50">
              Донат
            </button>
          </div>
          {Number(custom) >= 1 && (
            <p className="mt-2 text-sm text-white/50">≈ {uah(Number(custom) * rate)}</p>
          )}
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          <p className="mt-4 text-xs text-white/30">
            Повідомлення і нік видно всім. Посилання відкриваються з rel=nofollow. Я залишаю за собою
            право прибрати спам.
          </p>
        </section>

        {/* Top */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:col-span-2">
          <h2 className="text-2xl font-bold">🏆 Топ донатерів</h2>
          <ol className="mt-4 space-y-2">
            {stats.top.length === 0 && <li className="text-white/40">Будь першим!</li>}
            {stats.top.map((d, i) => (
              <li key={d.name} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
                <span className="w-6 text-center">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
                <span className="flex-1 truncate font-medium">{d.name}</span>
                <span className="font-bold text-bmw-light">{usd(d.totalUsd)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Wall */}
      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <h2 className="text-2xl font-bold">📢 Стіна підтримки</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {stats.recent.length === 0 && <p className="text-white/40">Поки порожньо.</p>}
          {stats.recent.map((s) => (
            <article key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <b className="truncate">{s.name}</b>
                <span className="shrink-0 rounded-full bg-bmw-blue/20 px-2 py-0.5 text-sm text-bmw-light">
                  {usd(s.amountUsd)}
                </span>
              </div>
              {s.message &&
                (s.link ? (
                  <a href={s.link} target="_blank" rel="nofollow sponsored noopener noreferrer"
                    className="mt-2 block break-words text-bmw-light underline-offset-2 hover:underline">
                    {s.message} ↗
                  </a>
                ) : (
                  <p className="mt-2 break-words text-white/80">{s.message}</p>
                ))}
              <div className="mt-2 text-xs text-white/30">{ago(s.paidAt)}</div>
            </article>
          ))}
        </div>
      </section>

      <footer className="mt-10 text-center text-sm text-white/30">
        Зроблено з любов’ю до баварського дизеля · BMW E60 530d
      </footer>
    </main>
  );
}
