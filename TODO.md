# Degusto cutover — по шагам

Ничего на прод не писать, пока шаг не подтверждён.

## Сейчас (готово в коде, ветка `sipan`)

- [x] Логин: старый bcrypt `$2y$` принимается, после входа хеш → Argon2id
- [x] Колбэк-пути как на живом сайте, без похода в банк:
  - Idram: `/idram`, `/idram/success`, `/idram/error`
  - Ineco: `/inecobank/result`
  - FastShift: `/pay-by-fastshift/callback`, `/pay-by-fastshift/webhook`
- [x] Эти пути не редиректятся на `/hy/...` (иначе Idram сломается)
- [x] В `.env.example` — пустые платёжные ключи. Живые значения только в `.env`

## Дальше

1. **Секреты в `.env`** — вставить live Idram / Ineco / FastShift (шаблоны уже в `.env.example`). В git не коммитить.
2. **Прочитать Neon (только SELECT)** — сколько users / products / orders уже есть, чтобы не залить каталог второй раз.
3. **Dry-run маппинга** — `import/dry_run.py` в папке миграции. Отчёт: `import/out/report.json`. В базу не пишет.
4. **Apply в staging** (не прод): users + bcrypt-хеши → addresses → заказы (гости как гости, аккаунты как аккаунты).
5. **Картинки** — старый диск / `Old/images` → R2, сверить с уже залитым каталогом.
6. **Idram / Arca / FastShift адаптеры** — повесить на те же старые URL, не на `/api/v1/payments/...`.
7. **Проверка логина** — один старый аккаунт: вход по старому паролю, в БД хеш стал `$argon2...`.
8. **Ночь cutover** — закрыть старый сайт, свежий дамп, snapshot, финальная заливка, DNS/прокси на новый. Откат = вернуть старый docroot.

## Не трогать

- `liaceramics.am`
- B2B (`b2b.degusto.am`)
- Прод MySQL / Restore snapshot без явной команды
