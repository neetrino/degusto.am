'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthContext';
import { ADMIN_MOBILE_HUB_PATH } from '@/constants/admin-mobile-profile';
import { STOREFRONT_PAGE_CONTAINER_CLASS } from '@/constants/storefront-desktop-layout';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';
import { isMobileViewport } from '../../lib/viewport';
import { useTranslation } from '../../lib/i18n-client';
import { useProfilePage } from './useProfilePage';
import { ProfileHeader } from './ProfileHeader';
import { ProfileMobilePage } from './ProfileMobilePage';
import { ProfileTabContent } from './ProfileTabContent';
import { ProfilePageSkeleton } from './ProfilePageSkeleton';
import { OrderDetailsModal } from './OrderDetailsModal';
import { PROFILE_TAB_ICONS, PROFILE_TAB_IDS } from './profile-tab-icons';
import type { ProfileTabConfig } from './types';

function ProfilePageContent() {
  const router = useRouter();
  const isMobileViewportActive = useIsMobileViewport();
  const { isLoggedIn, isLoading: authLoading, logout, isAdmin } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (authLoading || !isLoggedIn || !isAdmin) {
      return;
    }
    if (isMobileViewport()) {
      router.replace(ADMIN_MOBILE_HUB_PATH);
    }
  }, [authLoading, isAdmin, isLoggedIn, router]);

  const profileState = useProfilePage();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const tabs = useMemo<ProfileTabConfig[]>(
    () =>
      PROFILE_TAB_IDS.map((id) => ({
        id,
        label: t(`profile.tabs.${id}`),
        icon: PROFILE_TAB_ICONS[id],
      })),
    [t],
  );

  if (authLoading) {
    return <ProfilePageSkeleton />;
  }

  if (!isLoggedIn) {
    return null;
  }

  const tabContent = (
    <ProfileTabContent
      activeTab={profileState.activeTab}
      error={profileState.error}
      success={profileState.success}
      profile={profileState.profile}
      personalInfo={profileState.personalInfo}
      setPersonalInfo={profileState.setPersonalInfo}
      savingPersonal={profileState.savingPersonal}
      handleSavePersonalInfo={profileState.handleSavePersonalInfo}
      showAddressForm={profileState.showAddressForm}
      setShowAddressForm={profileState.setShowAddressForm}
      editingAddress={profileState.editingAddress}
      addressForm={profileState.addressForm}
      setAddressForm={profileState.setAddressForm}
      savingAddress={profileState.savingAddress}
      handleSaveAddress={profileState.handleSaveAddress}
      handleDeleteAddress={profileState.handleDeleteAddress}
      handleSetDefaultAddress={profileState.handleSetDefaultAddress}
      handleEditAddress={profileState.handleEditAddress}
      resetAddressForm={profileState.resetAddressForm}
      passwordForm={profileState.passwordForm}
      setPasswordForm={profileState.setPasswordForm}
      savingPassword={profileState.savingPassword}
      handleChangePassword={profileState.handleChangePassword}
      dashboardData={profileState.dashboardData}
      dashboardLoading={profileState.dashboardLoading}
      orders={profileState.orders}
      ordersLoading={profileState.ordersLoading}
      ordersPage={profileState.ordersPage}
      setOrdersPage={profileState.setOrdersPage}
      ordersMeta={profileState.ordersMeta}
      couponsLoading={profileState.couponsLoading}
      availableCoupons={profileState.availableCoupons}
      couponHistory={profileState.couponHistory}
      deleteAccountPassword={profileState.deleteAccountPassword}
      setDeleteAccountPassword={profileState.setDeleteAccountPassword}
      deleteAccountConfirmation={profileState.deleteAccountConfirmation}
      setDeleteAccountConfirmation={profileState.setDeleteAccountConfirmation}
      deleteAccountAcknowledged={profileState.deleteAccountAcknowledged}
      setDeleteAccountAcknowledged={profileState.setDeleteAccountAcknowledged}
      deletingAccount={profileState.deletingAccount}
      handleDeleteAccount={profileState.handleDeleteAccount}
      currency={profileState.currency}
      handleTabChange={profileState.handleTabChange}
      handleOrderClick={profileState.handleOrderClick}
      t={t}
    />
  );

  return (
    <div className="min-h-full bg-white">
      {isMobileViewportActive ? (
        <ProfileMobilePage
          profile={profileState.profile}
          tabs={tabs}
          activeTab={profileState.activeTab}
          onTabSelect={(tab) => {
            profileState.handleTabChange(tab);
            setIsMobileSheetOpen(true);
          }}
          onLogout={logout}
          t={t}
          isSheetOpen={isMobileSheetOpen}
          onCloseSheet={() => setIsMobileSheetOpen(false)}
        >
          {tabContent}
        </ProfileMobilePage>
      ) : (
        <div className={`${STOREFRONT_PAGE_CONTAINER_CLASS} py-10`}>
          <div className="grid grid-cols-12 items-start gap-6 lg:gap-8">
            <aside className="col-span-12 self-start lg:col-span-4 lg:sticky lg:top-28 xl:col-span-3">
              <ProfileHeader
                profile={profileState.profile}
                tabs={tabs}
                activeTab={profileState.activeTab}
                onTabChange={profileState.handleTabChange}
                onLogout={logout}
                t={t}
              />
            </aside>
            <main className="col-span-12 min-w-0 lg:col-span-8 xl:col-span-9">
              <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:space-y-8 md:p-6 lg:p-8">
                {tabContent}
              </div>
            </main>
          </div>
        </div>
      )}
      {profileState.selectedOrder && (
        <OrderDetailsModal
          selectedOrder={profileState.selectedOrder}
          orderDetailsLoading={profileState.orderDetailsLoading}
          orderDetailsError={profileState.orderDetailsError}
          isReordering={profileState.isReordering}
          currency={profileState.currency}
          onClose={() => profileState.setSelectedOrder(null)}
          onReOrder={profileState.handleReOrder}
          t={t}
        />
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfilePageContent />
    </Suspense>
  );
}
