'use client';

import { BodyBackground } from '@/components/BodyBackground';
import { NotFoundPageContent } from '@/components/errors/NotFoundPageContent';
import {
  NOT_FOUND_SURFACE_CLASS,
  NOT_FOUND_SURFACE_COLOR,
} from '@/components/errors/not-found-page.constants';
import { useNotFoundPageMarker } from '@/components/errors/not-found-page.context';

/** Fixed bar (`top-3`) + spacer (`92px`) — cream band must cover both on 404. */
const NOT_FOUND_HEADER_BACKDROP_HEIGHT_CLASS = 'h-[104px]';

/**
 * Custom 404 — branded Degusto storefront surface.
 */
export default function NotFound() {
  useNotFoundPageMarker();

  return (
    <>
      <BodyBackground color={NOT_FOUND_SURFACE_COLOR} />
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 -z-[1] ${NOT_FOUND_SURFACE_CLASS}`}
      />
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-x-0 top-0 z-40 ${NOT_FOUND_HEADER_BACKDROP_HEIGHT_CLASS} ${NOT_FOUND_SURFACE_CLASS}`}
      />
      <NotFoundPageContent />
    </>
  );
}
