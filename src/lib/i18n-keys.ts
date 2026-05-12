import enCommon from '../locales/en/common.json';

type Primitive = string | number | boolean | null | undefined;
type Join<Prefix extends string, Key extends string> = Prefix extends '' ? Key : `${Prefix}.${Key}`;

type LeafPaths<T, Prefix extends string = ''> =
  T extends Primitive
    ? Prefix
    : T extends readonly unknown[]
      ? Prefix
      : {
          [K in keyof T & string]: LeafPaths<T[K], Join<Prefix, K>>;
        }[keyof T & string];

type CommonTranslationKey = LeafPaths<typeof enCommon, 'common'>;

/**
 * Typed i18n key for compile-time-safe translation calls.
 * Use `TranslationKey` for static keys and `string` only for dynamic keys.
 */
export type TranslationKey = CommonTranslationKey;
