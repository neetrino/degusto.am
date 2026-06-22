export default function HomePageLoading() {
  return (
    <div
      className="min-h-screen w-full overflow-hidden bg-[var(--project-color)]"
      aria-busy="true"
      aria-label="Loading home"
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-6">
        <div className="animate-pulse space-y-5">
          <div className="h-12 w-36 rounded-xl bg-white/50" />
          <div className="h-12 w-full rounded-2xl bg-white/65" />
          <div className="h-40 w-full rounded-3xl bg-white/45" />
        </div>
      </div>

      <div className="mt-8 rounded-t-3xl bg-white px-4 pb-12 pt-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-40 rounded-lg bg-neutral-100" />
          <div className="grid grid-cols-4 gap-3">
            <div className="h-20 rounded-2xl bg-neutral-100" />
            <div className="h-20 rounded-2xl bg-neutral-100" />
            <div className="h-20 rounded-2xl bg-neutral-100" />
            <div className="h-20 rounded-2xl bg-neutral-100" />
          </div>
          <div className="h-52 w-full rounded-3xl bg-neutral-100" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-44 rounded-2xl bg-neutral-100" />
            <div className="h-44 rounded-2xl bg-neutral-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
