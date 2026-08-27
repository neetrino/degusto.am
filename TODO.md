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
- [x] Neon SELECT 27.08: 891 products (735 ACTIVE), 5 тестовых users, 2 COD orders

## Сейчас

- [x] **Idram** — форма GetPayment, RESULT `/idram`, success/error, checksum, корзина/склад только после confirm

## Дальше (не начинать без команды)

- [ ] Ineco / Arca на `/inecobank/result`
- [ ] Dry-run + apply users/orders в staging
- [ ] Картинки: сверка R2 с уже залитым каталогом
- [ ] Проверка логина старым паролем
- [ ] Ночь cutover

## Не трогать

- `liaceramics.am`
- B2B (`b2b.degusto.am`)
- Прод MySQL / Restore snapshot без явной команды
