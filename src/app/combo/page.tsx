import { BodyBackground } from '../../components/BodyBackground';
import { FigmaDesktopComboPage } from '../../components/home/FigmaDesktopComboPage';
import { FigmaMobileShopPage } from '../../components/home/FigmaMobileShopPage';

export default function ComboPage() {
  return (
    <div className="min-h-screen bg-white">
      <BodyBackground color="#ffffff" />
      <div className="lg:hidden">
        <FigmaMobileShopPage />
      </div>
      <FigmaDesktopComboPage />
    </div>
  );
}
