import { MobileHomePageLoading } from '../../components/home/MobileHomePageLoading';

export default function HomeLoading() {
  return (
    <>
      <MobileHomePageLoading />
      <div className="hidden min-h-[60vh] items-center justify-center lg:flex" aria-busy="true" aria-label="Loading home page">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-[#f66913]" />
      </div>
    </>
  );
}
