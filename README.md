# Збір на BMW E60 530d

Одна сторінка: Next.js 15 (App Router) + Tailwind + Firebase Firestore + monobank (Plata by mono).

## Запуск
1. `npm install`
2. `cp .env.example .env.local` і заповни (`MONO_TOKEN`, `NEXT_PUBLIC_SITE_URL`).
3. `npm run dev`

## Як працює оплата
- `POST /api/donate` рахує гривні за курсом НБУ, створює інвойс monobank (`/invoice/create`, ccy 980), зберігає `donations/{orderId}` (status `pending`) і віддає `pageUrl` — клієнт редіректить туди.
- Банк шле `POST /api/mono/webhook` (потрібен публічний URL). Статус інвойсу перевіряється повторним запитом до API банку; якщо `success` і сума збігається — у транзакції донат стає `paid`, а `stats/main.raisedUsd` росте (ідемпотентно).
- Топ донатерів і стіна рахуються з оплачених донатів.

## Firestore
Колекції: `donations`, `stats/main`. Сервер ходить у Firestore через web SDK, тому в rules має бути `allow read, write: if true;` (підходить лише для жартівливого проєкту — будь-хто зможе писати в базу).
Щоб додати вже зібрану суму вручну — задай `raisedUsd` у `stats/main`.
