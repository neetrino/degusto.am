import { Suspense, type ReactNode } from 'react';

export default function LegacyAdminUrlLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-sm px-4 py-16 text-center text-sm text-gray-500">…</div>
      }
    >
      {children}
    </Suspense>
  );
}
