export default function HomePageLoading() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="Loading home">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-8">
        <div className="h-64 animate-pulse rounded-3xl bg-[#f8f8f8]" />
      </div>
    </div>
  );
}
