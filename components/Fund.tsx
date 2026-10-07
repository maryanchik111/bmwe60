"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight, Car, Check, CircleCheck, ExternalLink, Heart, Megaphone,
  Medal, ShieldCheck, Trophy, Users, Zap,
} from "lucide-react";
import type { Stats } from "@/lib/donations";

const PRESETS = [100, 250, 500, 1000, 2500];
const MARQUEE = ["BMW E60", "530d", "3.0 дизель", "М57", "Ціль 330 000 ₴", "Реклама для донатерів"];

const uah = (n: number) => `${Math.round(n).toLocaleString("uk-UA")} ₴`;

function ago(ms: number) {
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return "щойно";
  if (m < 60) return `${m} хв тому`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} год тому`;
  return `${Math.floor(h / 24)} дн тому`;
}

const card = "rounded-[28px] bg-white p-6 sm:p-8 shadow-[0_4px_0_0_#d9d8d4]";
const field =
  "w-full rounded-2xl border-2 border-ink/10 bg-paper px-4 py-3 font-medium outline-none transition focus:border-brand placeholder:text-ink/35";

export default function Fund({ initial }: { initial: Stats }) {
  const [stats, setStats] = useState(initial);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(location.search).get("thanks")) {
      setThanks(true);
      history.replaceState(null, "", "/");
    }
    const load = () => fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => {});
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const pct = Math.min(100, (stats.raisedUah / stats.goalUah) * 100);

  async function donate(amountUah: number) {
    setError("");
    if (!(amountUah >= 10)) return setError("Мінімальна сума — 10 ₴");
    setBusy(amountUah);
    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUah, name, message, link }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      location.href = j.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка, спробуй ще раз");
      setBusy(null);
    }
  }

  const scrollToDonate = () => document.getElementById("donate")?.scrollIntoView({ behavior: "smooth" });

  return (
    <main className="overflow-x-hidden pb-20">
      <div className="mx-auto max-w-5xl px-4">
        <nav className="flex items-center justify-between pt-8">
          <div className="text-2xl font-black tracking-tight">
            bmw e60<span className="text-ink/40"> .fund</span>
          </div>
          <button onClick={scrollToDonate}
            className="rounded-full bg-ink px-6 py-3 font-bold text-white transition active:scale-95">
            Підтримати
          </button>
        </nav>

        <header className="pb-10 pt-14 sm:pt-20">
          <h1 className="text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">
            Збираю на BMW E60
            <br />
            <span className="inline-block -rotate-1 rounded-xl bg-brand px-3 text-white">3.0 дизель</span>{" "}
            разом із вами
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink/70 sm:text-xl">
            Шестициліндровий 530d — мрія, до якої лишилось зібрати {uah(stats.goalUah)}. Кожен учасник
            отримує рекламу свого повідомлення або посилання просто на цьому сайті.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button onClick={scrollToDonate}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 text-lg font-bold text-white shadow-[0_5px_0_0_#1c4fe4] transition active:translate-y-1 active:shadow-none">
              Долучитись <ArrowRight size={20} />
            </button>
            <a href="#wall"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-lg font-bold shadow-[0_5px_0_0_#d9d8d4] transition active:translate-y-1 active:shadow-none">
              Стіна підтримки
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-ink/60">
            {["Оплата карткою у гривнях", "Реклама для кожного донатера", "Прозорий прогрес"].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Check size={18} /> {t}</li>
            ))}
          </ul>
        </header>
      </div>

      <div className="my-6 -rotate-1 overflow-hidden bg-ink py-5 text-white">
        <div className="marquee flex w-max gap-10 whitespace-nowrap text-2xl font-extrabold">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((t, i) => (
            <span key={i} className="flex items-center gap-10">
              {t} <Zap size={18} className="fill-brand text-brand" />
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-4 pt-6">
        {thanks && (
          <div className="flex items-center gap-3 rounded-2xl bg-brand p-4 font-semibold text-white">
            <CircleCheck /> Дякую за підтримку! Після підтвердження платежу ти з’явишся у списку нижче.
          </div>
        )}

        <section className={card}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-5xl font-black tracking-tight sm:text-6xl">{uah(stats.raisedUah)}</div>
              <div className="mt-1 font-semibold text-ink/50">зібрано</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold">з {uah(stats.goalUah)}</div>
            </div>
          </div>
          <div className="mt-6 h-6 overflow-hidden rounded-full bg-paper">
            <div className="h-full rounded-full bg-brand transition-all duration-1000"
              style={{ width: `${Math.max(pct, 2)}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap justify-between gap-2 font-semibold text-ink/60">
            <span>{pct.toFixed(1)}%</span>
            <span className="flex items-center gap-1.5">
              <Users size={18} /> {stats.donorsCount} {stats.donorsCount === 1 ? "учасник" : "учасників"}
            </span>
            <span>Лишилось {uah(Math.max(0, stats.goalUah - stats.raisedUah))}</span>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-5">
          <section id="donate" className={`${card} scroll-mt-6 lg:col-span-3`}>
            <h2 className="flex items-center gap-2 text-3xl font-black tracking-tight">
              <Heart className="fill-brand text-brand" /> Приєднатись
            </h2>
            <p className="mt-2 text-ink/60">
              Натисни суму — одразу відкриється оплата monobank (картка, Apple Pay, Google Pay).
            </p>

            <div className="mt-5 space-y-3">
              <input className={field} placeholder="Твій нік (необов’язково)" maxLength={30}
                value={name} onChange={(e) => setName(e.target.value)} />
              <textarea className={field} rows={2} maxLength={160}
                placeholder="Твоя реклама / повідомлення для стіни (до 160 символів)"
                value={message} onChange={(e) => setMessage(e.target.value)} />
              {message && (
                <input className={field} placeholder="Посилання (сайт, Instagram, Telegram…)"
                  value={link} onChange={(e) => setLink(e.target.value)} />
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {PRESETS.map((p) => (
                <button key={p} disabled={busy !== null} onClick={() => donate(p)}
                  className="rounded-2xl bg-ink py-3 font-extrabold text-white shadow-[0_4px_0_0_#1c4fe4] transition active:translate-y-1 active:shadow-none disabled:opacity-50">
                  {busy === p ? "…" : uah(p)}
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-3.5 font-bold text-ink/40">₴</span>
                <input className={`${field} pl-8`} type="number" min={10} max={200000}
                  placeholder="Своя сума" value={custom} onChange={(e) => setCustom(e.target.value)} />
              </div>
              <button disabled={busy !== null} onClick={() => donate(Number(custom))}
                className="rounded-2xl bg-brand px-6 font-bold text-white shadow-[0_4px_0_0_#12318f] transition active:translate-y-1 active:shadow-none disabled:opacity-50">
                Донат
              </button>
            </div>
            {error && <p className="mt-3 font-semibold text-red-600">{error}</p>}
            <p className="mt-4 flex gap-2 text-xs text-ink/40">
              <ShieldCheck size={16} className="shrink-0" />
              Нік і повідомлення видно всім. Посилання з rel=nofollow. Спам я прибираю.
            </p>
          </section>

          <section className={`${card} lg:col-span-2`}>
            <h2 className="flex items-center gap-2 text-3xl font-black tracking-tight">
              <Trophy className="text-brand" /> Топ донатерів
            </h2>
            <ol className="mt-5 space-y-2">
              {stats.top.length === 0 && <li className="font-medium text-ink/40">Будь першим!</li>}
              {stats.top.map((d, i) => (
                <li key={d.name} className="flex items-center gap-3 rounded-2xl bg-paper px-3 py-2.5">
                  <span className="flex w-7 justify-center font-extrabold text-ink/40">
                    {i < 3 ? (
                      <Medal size={22} className={["text-yellow-500", "text-slate-400", "text-amber-700"][i]} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="flex-1 truncate font-bold">{d.name}</span>
                  <span className="font-extrabold text-brand">{uah(d.totalUah)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section id="wall" className={`${card} scroll-mt-6`}>
          <h2 className="flex items-center gap-2 text-3xl font-black tracking-tight">
            <Megaphone className="text-brand" /> Стіна підтримки
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {stats.recent.length === 0 && <p className="font-medium text-ink/40">Поки порожньо.</p>}
            {stats.recent.map((s) => (
              <article key={s.id} className="rounded-2xl bg-paper p-4">
                <div className="flex items-center justify-between gap-2">
                  <b className="truncate">{s.name}</b>
                  <span className="shrink-0 rounded-full bg-brand px-3 py-0.5 text-sm font-bold text-white">
                    {uah(s.amountUah)}
                  </span>
                </div>
                {s.message &&
                  (s.link ? (
                    <a href={s.link} target="_blank" rel="nofollow sponsored noopener noreferrer"
                      className="mt-2 inline-flex items-start gap-1.5 break-words font-semibold text-brand hover:underline">
                      {s.message} <ExternalLink size={16} className="mt-1 shrink-0" />
                    </a>
                  ) : (
                    <p className="mt-2 break-words font-medium text-ink/80">{s.message}</p>
                  ))}
                <div className="mt-2 text-xs font-medium text-ink/35">{ago(s.paidAt)}</div>
              </article>
            ))}
          </div>
        </section>

        <footer className="flex items-center justify-center gap-2 pt-6 text-sm font-medium text-ink/40">
          <Car size={18} /> Зроблено з любові до баварського дизеля
        </footer>
      </div>
    </main>
  );
}
