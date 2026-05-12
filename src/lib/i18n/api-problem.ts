import type { NextRequest } from 'next/server';
import { resolveStorefrontLocale, type StorefrontLocale } from './locale';

type ProblemKey =
  | 'internalErrorTitle'
  | 'internalErrorDetail'
  | 'notFoundTitle'
  | 'notFoundDetail'
  | 'unauthorizedTitle'
  | 'unauthorizedDetail'
  | 'forbiddenTitle'
  | 'forbiddenDetail'
  | 'validationErrorTitle'
  | 'validationErrorDetail';

const PROBLEM_TRANSLATIONS: Record<StorefrontLocale, Record<ProblemKey, string>> = {
  en: {
    internalErrorTitle: 'Internal Server Error',
    internalErrorDetail: 'An unexpected error occurred.',
    notFoundTitle: 'Not Found',
    notFoundDetail: 'Requested resource was not found.',
    unauthorizedTitle: 'Unauthorized',
    unauthorizedDetail: 'Authentication is required.',
    forbiddenTitle: 'Forbidden',
    forbiddenDetail: 'You do not have permission to perform this action.',
    validationErrorTitle: 'Validation Error',
    validationErrorDetail: 'Submitted data is invalid.',
  },
  hy: {
    internalErrorTitle: 'Սերվերի ներքին սխալ',
    internalErrorDetail: 'Տեղի ունեցավ անսպասելի սխալ:',
    notFoundTitle: 'Չի գտնվել',
    notFoundDetail: 'Հարցված ռեսուրսը չի գտնվել:',
    unauthorizedTitle: 'Չթույլատրված',
    unauthorizedDetail: 'Պահանջվում է նույնականացում:',
    forbiddenTitle: 'Արգելված է',
    forbiddenDetail: 'Դուք չունեք այս գործողությունը կատարելու իրավունք:',
    validationErrorTitle: 'Վավերացման սխալ',
    validationErrorDetail: 'Ուղարկված տվյալները անվավեր են:',
  },
  ru: {
    internalErrorTitle: 'Внутренняя ошибка сервера',
    internalErrorDetail: 'Произошла непредвиденная ошибка.',
    notFoundTitle: 'Не найдено',
    notFoundDetail: 'Запрошенный ресурс не найден.',
    unauthorizedTitle: 'Не авторизован',
    unauthorizedDetail: 'Требуется аутентификация.',
    forbiddenTitle: 'Доступ запрещен',
    forbiddenDetail: 'У вас нет прав для этого действия.',
    validationErrorTitle: 'Ошибка валидации',
    validationErrorDetail: 'Отправленные данные невалидны.',
  },
};

export interface LocalizedProblemResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
}

function resolveLocaleFromRequest(req: NextRequest): StorefrontLocale {
  const fromQuery = req.nextUrl.searchParams.get('lang');
  if (fromQuery) {
    return resolveStorefrontLocale(fromQuery);
  }

  const fromCookie = req.cookies.get('shop_language')?.value;
  if (fromCookie) {
    return resolveStorefrontLocale(fromCookie);
  }

  const acceptLanguage = req.headers.get('accept-language');
  if (acceptLanguage) {
    const first = acceptLanguage.split(',')[0] ?? '';
    const normalized = first.split('-')[0] ?? '';
    return resolveStorefrontLocale(normalized);
  }

  return 'hy';
}

export function getLocalizedProblemText(req: NextRequest, key: ProblemKey): string {
  const locale = resolveLocaleFromRequest(req);
  return PROBLEM_TRANSLATIONS[locale][key];
}

export function buildLocalizedProblem(
  req: NextRequest,
  params: {
    type: string;
    status: number;
    titleKey: ProblemKey;
    detailKey: ProblemKey;
    instance?: string;
    code?: string;
    detailOverride?: string;
    titleOverride?: string;
  }
): LocalizedProblemResponse {
  return {
    type: params.type,
    status: params.status,
    title: params.titleOverride ?? getLocalizedProblemText(req, params.titleKey),
    detail: params.detailOverride ?? getLocalizedProblemText(req, params.detailKey),
    instance: params.instance,
    code: params.code,
  };
}
