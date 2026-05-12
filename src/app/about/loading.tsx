export default function AboutLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white" aria-busy="true" aria-label="Loading about page">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-[#f66913]" />
    </div>
  );
}
