# Збір на BMW E60 530d

Одна сторінка: Next.js 15 (App Router) + Tailwind + Firebase Firestore + LiqPay.

## Запуск
1. `npm install`
2. `cp .env.example .env.local` і заповни (Firebase service account, ключі LiqPay, `NEXT_PUBLIC_SITE_URL`).
3. `npm run dev`

## Як працює оплата
- `POST /api/donate` створює `donations/{orderId}` (status `pending`), рахує гривні за курсом НБУ й повертає підписану форму LiqPay.
- LiqPay шле `POST /api/liqpay/callback` (server_url — потрібен публічний URL). Підпис перевіряється, у транзакції донат стає `paid`, а `stats/main.raisedUsd` збільшується (ідемпотентно).
- Топ донатерів і стіна рахуються з оплачених донатів.

## Firestore
Колекції: `donations`, `stats/main`. Доступ лише через сервер (Admin SDK) — у rules постав `allow read, write: if false;`.
Щоб додати вже зібрану суму вручну — задай `raisedUsd` у `stats/main`.
