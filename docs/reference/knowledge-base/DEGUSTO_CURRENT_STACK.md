# Degusto — ընթացիկ stack (այս repo)

> Ընդհանուր խորհուրդները տե՛ս [`TECH_STACK.md`](./TECH_STACK.md)։ Այս ֆայլը **միայն այս workspace-ում արդեն կիրառվող** տեխնոլոգիաներն է ամփոփում, որպեսզի չխառնվեն «C-դասի» roadmap-ային տարբերակների հետ։

---

## Որոնում (instant catalog search)

| Իրականություն | Մանրամասն |
|----------------|-----------|
| **ԲԴ + ORM** | PostgreSQL + Prisma |
| **Մոտեցում** | `db.product.findMany` + `contains` (`mode: 'insensitive'`) `ProductTranslation.title` / `subtitle` և `ProductVariant.sku` դաշտերում |
| **API** | `GET /api/search/instant` — `src/app/api/search/instant/route.ts` |
| **Չի օգտագործվում** | Meilisearch, Elasticsearch, Algolia, Redis search, հերթային ինդեքսավորում |

Միայն **տեքստային substring** համընկնում է (ոչ typo-tolerance, ոչ relevance scoring)։ Մեծ կատալոգի համար ապագայում կարող է քննարկվել առանձին search engine։

---

## Հերթեր (jobs / background)

| Իրականություն | Մանրամասն |
|----------------|-----------|
| **Չի կիրառվում** | BullMQ, Bull, սերվիսային job worker-ներ այս repo-ում |
| **Նշում** | `TECH_STACK.md`-ում BullMQ-ն նշված է որպես **խորհուրդ մեծ (C) նախագծերի** համար, ոչ թե Degusto-ի ընթացիկ կոդի պահանջ |

---

## Կապված փաստաթղթեր

- Epic / առաջադիմություն՝ `docs/EPIC_PROGRESS_BACKEND.md` (instant search շարքում նշված է որպես Done)

---

**Վերջին թարմացում.** 2026-05-14
