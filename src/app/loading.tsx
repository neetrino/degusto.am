export default function RootLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" aria-busy="true" aria-label="Loading page">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-[#f66913]" />
    </div>
  );
}
