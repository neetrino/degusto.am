import type { Dispatch, FormEvent, MouseEvent, SetStateAction } from 'react';
import type { CurrencyCode } from '@/lib/currency';
import { ProfileDashboard } from './ProfileDashboard';
import { ProfilePersonalInfo } from './ProfilePersonalInfo';
import { ProfileAddresses } from './ProfileAddresses';
import { ProfileOrders } from './ProfileOrders';
import { ProfileCoupons } from './ProfileCoupons';
import { ProfilePassword } from './ProfilePassword';
import { ProfileDeleteAccount } from './ProfileDeleteAccount';
import type {
  Address,
  CouponHistoryItem,
  DashboardData,
  OrderListItem,
  ProfileTab,
  UserCoupon,
  UserProfile,
} from './types';
import type { OrdersListMeta } from '@/lib/users/profile-data-cache';

interface ProfileTabContentProps {
  activeTab: ProfileTab;
  error: string | null;
  success: string | null;
  profile: UserProfile | null;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  setPersonalInfo: (info: ProfileTabContentProps['personalInfo']) => void;
  savingPersonal: boolean;
  handleSavePersonalInfo: (e: FormEvent) => void;
  showAddressForm: boolean;
  setShowAddressForm: (show: boolean) => void;
  editingAddress: Address | null;
  addressForm: Address;
  setAddressForm: (address: Address) => void;
  savingAddress: boolean;
  handleSaveAddress: (e: FormEvent) => void;
  handleDeleteAddress: (addressId: string) => void;
  handleSetDefaultAddress: (addressId: string) => void;
  handleEditAddress: (address: Address) => void;
  resetAddressForm: () => void;
  passwordForm: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  setPasswordForm: (form: ProfileTabContentProps['passwordForm']) => void;
  savingPassword: boolean;
  handleChangePassword: (e: FormEvent) => void;
  dashboardData: DashboardData | null;
  dashboardLoading: boolean;
  orders: OrderListItem[];
  ordersLoading: boolean;
  ordersPage: number;
  setOrdersPage: Dispatch<SetStateAction<number>>;
  ordersMeta: OrdersListMeta | null;
  couponsLoading: boolean;
  availableCoupons: UserCoupon[];
  couponHistory: CouponHistoryItem[];
  deleteAccountPassword: string;
  setDeleteAccountPassword: (value: string) => void;
  deleteAccountConfirmation: string;
  setDeleteAccountConfirmation: (value: string) => void;
  deleteAccountAcknowledged: boolean;
  setDeleteAccountAcknowledged: (value: boolean) => void;
  deletingAccount: boolean;
  handleDeleteAccount: (e: FormEvent) => void;
  currency: CurrencyCode;
  handleTabChange: (tab: ProfileTab) => void;
  handleOrderClick: (orderNumber: string, e: MouseEvent<HTMLAnchorElement>) => void;
  t: (key: string) => string;
}

export function ProfileTabContent({
  activeTab,
  error,
  success,
  profile,
  personalInfo,
  setPersonalInfo,
  savingPersonal,
  handleSavePersonalInfo,
  showAddressForm,
  setShowAddressForm,
  editingAddress,
  addressForm,
  setAddressForm,
  savingAddress,
  handleSaveAddress,
  handleDeleteAddress,
  handleSetDefaultAddress,
  handleEditAddress,
  resetAddressForm,
  passwordForm,
  setPasswordForm,
  savingPassword,
  handleChangePassword,
  dashboardData,
  dashboardLoading,
  orders,
  ordersLoading,
  ordersPage,
  setOrdersPage,
  ordersMeta,
  couponsLoading,
  availableCoupons,
  couponHistory,
  deleteAccountPassword,
  setDeleteAccountPassword,
  deleteAccountConfirmation,
  setDeleteAccountConfirmation,
  deleteAccountAcknowledged,
  setDeleteAccountAcknowledged,
  deletingAccount,
  handleDeleteAccount,
  currency,
  handleTabChange,
  handleOrderClick,
  t,
}: ProfileTabContentProps) {
  return (
    <>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-600">{success}</div>}
      {activeTab === 'dashboard' && (
        <ProfileDashboard
          dashboardData={dashboardData}
          dashboardLoading={dashboardLoading}
          currency={currency}
          onTabChange={handleTabChange}
          onOrderClick={handleOrderClick}
          t={t}
        />
      )}
      {activeTab === 'personal' && (
        <ProfilePersonalInfo
          personalInfo={personalInfo}
          setPersonalInfo={setPersonalInfo}
          savingPersonal={savingPersonal}
          onSave={handleSavePersonalInfo}
          profile={profile}
          t={t}
        />
      )}
      {activeTab === 'addresses' && (
        <ProfileAddresses
          profile={profile}
          showAddressForm={showAddressForm}
          setShowAddressForm={setShowAddressForm}
          editingAddress={editingAddress}
          addressForm={addressForm}
          setAddressForm={setAddressForm}
          savingAddress={savingAddress}
          onSave={handleSaveAddress}
          onDelete={handleDeleteAddress}
          onSetDefault={handleSetDefaultAddress}
          onEdit={handleEditAddress}
          onResetForm={resetAddressForm}
          t={t}
        />
      )}
      {activeTab === 'orders' && (
        <ProfileOrders
          orders={orders}
          ordersLoading={ordersLoading}
          ordersPage={ordersPage}
          setOrdersPage={setOrdersPage}
          ordersMeta={ordersMeta}
          currency={currency}
          onOrderClick={handleOrderClick}
          t={t}
        />
      )}
      {activeTab === 'coupons' && (
        <ProfileCoupons
          couponsLoading={couponsLoading}
          availableCoupons={availableCoupons}
          couponHistory={couponHistory}
          t={t}
        />
      )}
      {activeTab === 'password' && (
        <ProfilePassword
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          savingPassword={savingPassword}
          onSave={handleChangePassword}
          t={t}
        />
      )}
      {activeTab === 'deleteAccount' && (
        <ProfileDeleteAccount
          profile={profile}
          password={deleteAccountPassword}
          setPassword={setDeleteAccountPassword}
          confirmation={deleteAccountConfirmation}
          setConfirmation={setDeleteAccountConfirmation}
          acknowledged={deleteAccountAcknowledged}
          setAcknowledged={setDeleteAccountAcknowledged}
          deleting={deletingAccount}
          onSubmit={handleDeleteAccount}
          t={t}
        />
      )}
    </>
  );
}
