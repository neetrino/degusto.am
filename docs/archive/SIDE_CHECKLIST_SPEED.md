# Чек-лист ускорения сайта

Короткая инструкция: как делать быстро, дёшево для БД и CDN. Подходит для любого Next.js storefront.

**Цель:** первый экран — мгновенно; тяжёлые данные — из кеша; БД — только на cache miss и при изменениях.

**Degusto.am — статус внедрения:** 2026-06-23 (Phase 1–2: ISR/locale/Redis TTL/warm; read-model — не делали).

---

## 1. Три слоя (в таком порядке)

| Слой | Что даёт | Когда |
|------|----------|-------|
| **Static / ISR** | HTML с данными с CDN, без lambda | Маркeting, about, brands, home |
| **Redis read-through** | Тёплый ответ ~50–200 ms | PLP, PDP, категории, бренды |
| **Read-model (проекция)** | Один индексный запрос вместо JOIN | Каталог, PDP, фильтры брендов |

Не прыгай сразу в Redis — сначала убери всё, что ломает статику.

---

## 2. Чек-лист по шагам

### A. Не ломай статический рендер

- [x] **Root `layout.tsx` без `cookies()` / `headers()`** — иначе весь сайт dynamic.
- [x] Язык/валюта — дефолт на сервере + клиентский скрипт / `localStorage`, не SSR-cookie. (`StorefrontLocaleUrlSync`, `?lang=`, `PRIMARY_LOCALE`)
- [x] Контентные страницы (about, contact, legal) — `'use client'` + `useTranslation`, страница static.

### B. Статика и ISR

- [x] **`export const revalidate = N`** + при необходимости `dynamic = 'force-static'`. (`STOREFRONT_ISR_REVALIDATE_SECONDS` = 24h на `/`, `/shop`, `/combo`, `/products/[slug]`)
- [x] **Данные в HTML**, не client-fetch после гидрации — иначе пользователь ждёт skeleton (пример: `/brands`).
- [x] **`unstable_cache` + tag** для Next.js CDN-кеша; **`revalidateTag` / `revalidatePath`** из admin PUT/POST.
- [x] Home, brands, legal — prerender при build; обновление по событию, не по короткому TTL. (home/legal; `/brands` в проекте нет)

### C. Read-model (дешёвая БД)

> **Паттерн = отраслевой эталон** (CQRS / денормализованная проекция, та же идея, что поисковый индекс). Применять **выборочно**, не везде.
>
> **Применять**, если: чтений ≫ записей, живой запрос требует много JOIN/агрегаций, латентность видна пользователю (первый экран).
> **Не применять**, если: низкий трафик (админ-списки), простой одно-табличный запрос, данные меняются чаще, чем читаются, или нужна строгая консистентность.
> **Издержки (помнить):** лишнее хранилище + write-amplification (1 запись → rebuild N строк); eventual consistency (нужны надёжная инвалидация и команда полного rebuild/backfill).

- [ ] Горячие пути — **денormalized таблицы** (`ProductListingRow`, `ProductPdpRow`), не deep Prisma include.
- [ ] Проекция хранит **плоские поля + предпосчёт** (`priceSort`, `discountPercent`, `inStock`) + **токены фасетов** (`colorTokens[]`, `categoryIds[]`) под GIN-индексы.
- [ ] Фильтры/фасеты — по проекции, не `EXISTS` на каждую строку (пример: бренды через `GROUP BY brandId`).
- [ ] Синк проекции — одна точка (`product-read-model-sync`); после sync — инвалидация кешей.
- [ ] Есть команда **полного rebuild/backfill** проекции (на случай рассинхрона / миграции схемы).

*Частично:* lean `getShopMenuProductSelect` + batch enrich — облегчённый Prisma, не read-model.

### D. Redis read-through

- [x] **`getCachedJson(key, ttl, fetcher)`** — один паттерн для всех public GET. (`src/lib/cache/storefront-cache.ts`)
- [x] Upstash: **`automaticDeserialization: false`** (строка JSON in/out).
- [x] **Длинный TTL (24h)** + **явная инвалидация** при изменении данных — не короткий TTL «ради свежести». (`STOREFRONT_REDIS_TTL_SECONDS`)
- [x] Инвалидация по **scoped patterns** (`cache:products:plp:*`, `cache:products:pdp:*`, `home:brand-partners:*`).
- [x] **`invalidateProductReadCaches()`** — PLP + PDP + brands в одном месте после sync товара.

### E. Прогрев (warm-up)

- [x] После deploy / cold start — **loopback POST** на internal warm route (не import Redis в instrumentation). (`/api/internal/cache-warm`, `src/instrumentation.ts`)
- [x] Прогрев: home rails, default PLP, top-N PDP, categories, **brands** (3 локали). (home/shop/combo × 3 locale + top-12 PDP; brands route нет)
- [x] **Bounded concurrency** — не 100 параллельных запросов в БД на старте.
- [x] На Vercel: standalone + env `CACHE_WARM_ON_START=1`; serverless без warm = холодный каждый раз. (env: `CACHE_WARM_ON_START=1`, `CACHE_WARM_SECRET`)

### F. Клиент — мгновенная навигация

- [x] PLP → PLP / menu → shop: **client-side URL** (`history.pushState`), не full RSC navigation.
- [x] PLP → PDP: **seed из карточки** (фото, цена, title) + фоновый fetch полного PDP.
- [x] React Query: `initialData` / `placeholderData`, не пустой экран при переходе. (эквивалент: `product-summary-cache` + custom fetch, без React Query)
- [x] Prefetch: pointerdown / idle, **узко** (route + API params), не blast всего каталога.

### G. PDP

- [x] Detail + related — **parallel** SSR; один Redis key на slug+lang.
- [x] Listing shell (`isListingShell`) — UI сразу, кнопки disabled до полных данных. (`streamDetails` + visual shell + skeleton)
- [x] Long TTL + invalidation on product change; optional warm top-24 from page-1 PLP.

---

## 3. Правило TTL

```
Короткий TTL без invalidation = постоянные cache miss = дорогая БД.
Длинный TTL + invalidation on write     = быстро + свежо после правок.
```

Admin меняет данные → `revalidatePath` / `revalidateTag` + `deletePattern` Redis → пользователь видит новое сразу.

---

## 4. Анти-паттерны

| Не делать | Почему |
|-----------|--------|
| Client-only fetch для первого экрана | +300–800 ms skeleton после каждого захода |
| `cookies()` в root layout | Весь сайт dynamic |
| Короткий TTL «на всякий случай» | Кеш почти не работает |
| `products: { some: ... }` на списках | N× EXISTS, секунды на cold |
| Warm без auth / CSRF exempt internal route | Warm не запускается (403) |
| `next start` при `output: standalone` | Нет instrumentation → нет warm |

---

## 5. Быстрая проверка после внедрения

1. **`pnpm build`** — hot routes `○` (static/ISR), не `ƒ` без причины.
2. **Cold vs warm** — `curl -w '%{time_total}'` на page HTML и API; warm &lt; 200 ms.
3. **Browser** — переход menu → page: нет skeleton там, где данные уже есть.
4. **После admin PUT** — страница/API обновились без ожидания TTL.
5. **Production** — Vercel CDN отдаёт `/brands`, `/` из edge; БД не дергается на каждый визит.

---

## 6. Порядок работ на новом сайте

1. Убрать dynamic из layout (cookies/headers).
2. Статика / ISR для marketing + embed данных в HTML.
3. Read-model для каталога и PDP.
4. Redis read-through + long TTL + invalidation map.
5. Warm на старте + revalidate из admin.
6. Client navigation + seeds для переходов внутри shop.

---

## 7. Degusto.am — изменённые файлы (2026-06-23)

| Область | Файлы |
|---------|--------|
| ISR TTL | `src/constants/storefront-isr.ts`, home/shop/combo/PDP `page.tsx`, data services |
| Locale без cookie | `StorefrontLocaleUrlSync.tsx`, `locale.ts`, shop/combo/PDP pages |
| Shop без `headers()` | `src/app/shop/page.tsx` (CSS `lg:` вместо UA) |
| Redis | `storefront-cache.ts` (`getCachedJson`, `invalidateProductReadCaches`), `cache.service.ts` |
| Warm | `warm-storefront-caches.ts`, `/api/internal/cache-warm`, `instrumentation.ts` |
| Client API lang | `fetch-shop-menu-products.client.ts` |

**Env (production):** `CACHE_WARM_ON_START=1`, `CACHE_WARM_SECRET=<random>`.

---

*Marco.am — реализация: см. commits от 2026-06-20, `docs/PLP_CACHE_PERFORMANCE_DONE.md`, `docs/ARCHITECTURE_PERFORMANCE_STANDARDS.md`.*
