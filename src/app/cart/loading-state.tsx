'use client';

export function LoadingState() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="animate-pulse">
        <div className="mb-6 h-8 w-52 rounded bg-gray-200"></div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-[420px] rounded-2xl bg-gray-200" />
          <div className="h-[300px] rounded-2xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}




