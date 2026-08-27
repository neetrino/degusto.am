# Degusto cutover — по шагам

Ничего на прод не писать, пока шаг не подтверждён.
После каждого шага: проверка (lint / typecheck / tests / правила проекта) → коммит на `sipan` → стоп, ждать команду.

## Порядок

1. Оплата: Idram → Ineco (Arca). FastShift не в первой волне.
2. Потом заливка: users + addresses + заказы (гости как гости). Каталог в Neon уже есть — не лить второй раз.
3. Ночь cutover.

Протокол и checksum — из `docs/reference/payment integration/`.  
URL колбэков — как на старом сайте, не `/api/v1/payments/...`.  
Платёж хранить в новой схеме (`payments` + `payment_status`), не копировать PHP-костыли (`paid_at`, session).

## Сделано

- [x] Логин: bcrypt `$2y$` → после входа Argon2id
- [x] Колбэк-пути заняты, без locale-редиректа
- [x] `.env.example` — пустые платёжные ключи; live только в `.env`
- [x] Neon SELECT 27.08: 891 products (735 ACTIVE)
- [x] Тестовый мусор в Neon вычищен (5 users, p100/p101, корзины/сессии); склад тестовых заказов возвращён

## Сейчас

- [x] **Idram** — форма GetPayment, RESULT `/idram`, success/error, checksum, корзина/склад только после confirm
- [x] **Ineco / Arca** — register.do, returnUrl `/inecobank/result`, статус только из getOrderStatusExtended
- [x] **Скрипт заливки + dry-run** — `pnpm import:legacy:dry`
- [x] **Apply в Neon** — 2134 users, 1218 addresses, 27745 orders (21974 гостя)

## Дальше (не начинать без команды)

- [x] Картинки: сверка R2 — все 917 `uploads/` + живые категории на месте; 25 битых ключей только у ARCHIVED seed-категорий
- [ ] Проверка логина старым паролем
- [ ] Ночь cutover

## Не трогать

- `liaceramics.am`
- B2B (`b2b.degusto.am`)
- Прод MySQL / Restore snapshot без явной команды
