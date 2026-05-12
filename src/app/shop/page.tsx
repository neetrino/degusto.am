import { FigmaDesktopShopPage } from '../../components/home/FigmaDesktopShopPage';
import { FigmaMobileShopPage } from '../../components/home/FigmaMobileShopPage';
import { BodyBackground } from '../../components/BodyBackground';

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-white">
      <BodyBackground color="#ffffff" />
      <div className="lg:hidden">
        <FigmaMobileShopPage />
      </div>
      <FigmaDesktopShopPage />
    </div>
  );
}
