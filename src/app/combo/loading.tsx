export default function ComboPageLoading() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="Loading combo">
      <div className="min-h-[480px] animate-pulse bg-white" />
    </div>
  );
}
