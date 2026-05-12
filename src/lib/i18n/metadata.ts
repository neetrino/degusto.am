import type { StorefrontLocale } from './locale';

interface SiteMetadataCopy {
  title: string;
  description: string;
}

const SITE_METADATA_COPY: Record<StorefrontLocale, SiteMetadataCopy> = {
  en: {
    title: 'Degusto - Professional E-commerce',
    description: 'Modern e-commerce platform',
  },
  hy: {
    title: 'Degusto - Պրոֆեսիոնալ օնլայն խանութ',
    description: 'Ժամանակակից էլեկտրոնային առևտրի հարթակ',
  },
  ru: {
    title: 'Degusto - Профессиональный интернет-магазин',
    description: 'Современная платформа электронной коммерции',
  },
};

interface ProductFallbackCopy {
  title: string;
  notFound: string;
}

const PRODUCT_METADATA_FALLBACK: Record<StorefrontLocale, ProductFallbackCopy> = {
  en: {
    title: 'Product',
    notFound: 'Product not found',
  },
  hy: {
    title: 'Ապրանք',
    notFound: 'Ապրանքը չի գտնվել',
  },
  ru: {
    title: 'Товар',
    notFound: 'Товар не найден',
  },
};

export function getSiteMetadataCopy(locale: StorefrontLocale): SiteMetadataCopy {
  return SITE_METADATA_COPY[locale];
}

export function getProductMetadataFallbackCopy(locale: StorefrontLocale): ProductFallbackCopy {
  return PRODUCT_METADATA_FALLBACK[locale];
}
