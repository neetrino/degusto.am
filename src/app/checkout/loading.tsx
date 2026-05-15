export default function CheckoutLoading() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center px-4 py-24"
      aria-busy="true"
      aria-label="Loading checkout"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#F66812]/25 border-t-[#F66812]" />
    </div>
  );
}
