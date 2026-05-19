# Prisma + Vercel: товары есть локально, но не видны на production

## Кратко

Проблема проявляется так: локально Next.js приложение получает товары из PostgreSQL, а на Vercel витрина пустая или API возвращает `503`. В нашем случае причина была не в данных и не в Neon, а в Prisma Client: на Vercel serverless runtime Prisma не находил Linux query engine.

Типичная ошибка в `/api/health/db`:

```text
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
```

Локально всё работало, потому что Prisma использовал macOS engine. На Vercel нужен Linux engine (`rhel-openssl-3.0.x`), и он должен корректно попадать в serverless bundle.

## Почему это произошло

В проекте Prisma Client генерировался в кастомный путь:

```prisma
output = "../src/generated/prisma-client"
```

После этого приложение импортировало Prisma не из стандартного `@prisma/client`, а из кастомной generated-папки. Для локальной разработки это может работать, но на Vercel/Next.js monorepo такой setup часто ломает output tracing: Prisma engine не попадает туда, где serverless функция ищет его в runtime.

Дополнительно проблему усиливали:

- alias `@prisma/client` на кастомную generated-папку в `tsconfig.json` / `next.config.js`;
- ручные `outputFileTracingIncludes`;
- попытки вручную копировать `libquery_engine-rhel-openssl-3.0.x.so.node`;
- ручной `PRISMA_QUERY_ENGINE_LIBRARY`;
- `output: "standalone"` для Vercel deployment.

Это рабочие workaround-ы, но они хрупкие. Профессиональнее сделать так, чтобы Prisma и Vercel работали по стандартному пути.

## Правильное решение

1. Использовать стандартный Prisma Client output.

В `schema.prisma` оставить generator без `output`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
  binaryTargets   = ["native", "rhel-openssl-3.0.x"]
}
```

2. Импортировать Prisma Client стандартно:

```ts
import { PrismaClient } from "@prisma/client";
```

Не импортировать из `./src/generated/prisma-client`.

3. Удалить alias для `@prisma/client`.

В `tsconfig.json` не должно быть:

```json
"@prisma/client": ["./shared/db/src/generated/prisma-client"]
```

В `next.config.js` не должно быть webpack alias на generated Prisma client.

4. Для monorepo/Vercel использовать официальный Prisma plugin:

```js
const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");

webpack: (config, { isServer }) => {
  if (isServer) {
    config.plugins = [...(config.plugins ?? []), new PrismaPlugin()];
  }
  return config;
};
```

5. Не делать ручное копирование engine.

Удалить скрипты вида:

```text
ensure-prisma-rhel-engine.js
```

Не выставлять вручную:

```text
PRISMA_QUERY_ENGINE_LIBRARY
```

6. Для Vercel не использовать `output: "standalone"`, если проект деплоится стандартным Vercel Next.js preset.

Vercel сам управляет output. `standalone` полезен для Docker/самостоятельного Node hosting, но в этом кейсе мешал tracing.

## Env checklist для Neon + Vercel

В Vercel Production должны быть:

```text
DATABASE_URL = Neon pooled URL, host содержит -pooler
DIRECT_URL = Neon direct URL, без -pooler
NEXT_PUBLIC_API_URL = пусто или удалить
NEXT_PUBLIC_APP_URL = https://your-production-domain
APP_URL = https://your-production-domain
JWT_SECRET = strong production secret
```

Важно: `DIRECT_URL` нужен для миграций. Он не должен быть pooled URL.

## Build/deploy checklist

Перед деплоем:

```bash
pnpm run db:generate
pnpm exec tsc --noEmit
pnpm run build
pnpm run lint
```

После деплоя проверить:

```text
/api/health/db
/api/v1/products?limit=3
```

Ожидаемый результат:

```json
{
  "status": "ok",
  "database": "up"
}
```

И API товаров должен вернуть `data` с товарами и корректный `meta.total`.

## Как отличить проблему Prisma от проблемы данных

Если `/api/health/db` возвращает ошибку Prisma query engine, проблема в runtime/bundle, а не в товарах.

Если `/api/health/db` возвращает `ok`, но товаров нет, тогда проверять уже данные:

```sql
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM products WHERE published = true AND "deletedAt" IS NULL;
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC;
```

## Итог

Лучшее production-решение: стандартный `@prisma/client`, без кастомного generated output, без alias, без ручного копирования engine, с официальным Prisma monorepo plugin для Next.js/Vercel. Это меньше кода, меньше хрупких путей и стабильнее переносится на другие проекты.
