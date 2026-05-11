import { useProfile } from './hooks/useProfile';
import { usePersonalInfo } from './hooks/usePersonalInfo';
import { useAddresses } from './hooks/useAddresses';
import { usePassword } from './hooks/usePassword';
import { useDeleteAccount } from './hooks/useDeleteAccount';
import { useDashboard } from './hooks/useDashboard';
import { useOrders } from './hooks/useOrders';
import { useProfileTabs } from './hooks/useProfileTabs';
import { useCurrency } from './hooks/useCurrency';
import { useTranslation } from '../../lib/i18n-client';

export function useProfilePage() {
  const { t } = useTranslation();
  
  // Core profile hook
  const {
    profile,
    setProfile,
    loading,
    error,
    success,
    setError,
    setSuccess,
    loadProfile,
    isLoggedIn,
    authLoading,
  } = useProfile();

  // Personal info hook
  const personalInfo = usePersonalInfo({
    profile,
    onProfileUpdate: (updated) => {
      setProfile(updated);
    },
    onError: setError,
    onSuccess: setSuccess,
  });

  // Addresses hook
  const addresses = useAddresses({
    profile,
    onProfileReload: loadProfile,
    onError: setError,
    onSuccess: setSuccess,
  });

  // Tabs management
  const { activeTab, handleTabChange: baseHandleTabChange } = useProfileTabs();

  // Password hook
  const password = usePassword({
    onError: setError,
    onSuccess: setSuccess,
  });

  const deleteAccount = useDeleteAccount({
    hasPassword: profile?.hasPassword ?? true,
    onError: setError,
  });

  // Enhanced tab change with address form cleanup
  const handleTabChange = (tab: typeof activeTab) => {
    baseHandleTabChange(tab);
    setError(null);
    setSuccess(null);
    if (tab !== 'addresses') {
      addresses.setShowAddressForm(false);
      addresses.setEditingAddress(null);
    }
    if (tab !== 'deleteAccount') {
      deleteAccount.resetForm();
    }
  };

  // Dashboard hook
  const dashboard = useDashboard({
    isLoggedIn,
    authLoading,
    activeTab,
    onError: setError,
  });

  // Orders hook
  const orders = useOrders({
    isLoggedIn,
    authLoading,
    activeTab,
    onError: setError,
    onSuccess: setSuccess,
  });

  // Currency hook
  const { currency } = useCurrency();

  return {
    // Auth & loading
    isLoggedIn,
    authLoading,
    loading,
    error,
    success,
    setError,
    setSuccess,
    
    // Profile
    profile,
    
    // Tabs
    activeTab,
    handleTabChange,
    
    // Personal info
    personalInfo: personalInfo.personalInfo,
    setPersonalInfo: personalInfo.setPersonalInfo,
    savingPersonal: personalInfo.savingPersonal,
    handleSavePersonalInfo: personalInfo.handleSavePersonalInfo,
    
    // Addresses
    showAddressForm: addresses.showAddressForm,
    setShowAddressForm: addresses.setShowAddressForm,
    editingAddress: addresses.editingAddress,
    addressForm: addresses.addressForm,
    setAddressForm: addresses.setAddressForm,
    savingAddress: addresses.savingAddress,
    handleSaveAddress: addresses.handleSaveAddress,
    handleDeleteAddress: addresses.handleDeleteAddress,
    handleSetDefaultAddress: addresses.handleSetDefaultAddress,
    handleEditAddress: addresses.handleEditAddress,
    resetAddressForm: addresses.resetAddressForm,
    
    // Password
    passwordForm: password.passwordForm,
    setPasswordForm: password.setPasswordForm,
    savingPassword: password.savingPassword,
    handleChangePassword: password.handleChangePassword,

    // Delete account
    deleteAccountPassword: deleteAccount.password,
    setDeleteAccountPassword: deleteAccount.setPassword,
    deleteAccountConfirmation: deleteAccount.confirmation,
    setDeleteAccountConfirmation: deleteAccount.setConfirmation,
    deleteAccountAcknowledged: deleteAccount.acknowledged,
    setDeleteAccountAcknowledged: deleteAccount.setAcknowledged,
    deletingAccount: deleteAccount.deleting,
    handleDeleteAccount: deleteAccount.handleDeleteAccount,
    
    // Dashboard
    dashboardData: dashboard.dashboardData,
    dashboardLoading: dashboard.dashboardLoading,
    
    // Orders
    orders: orders.orders,
    ordersLoading: orders.ordersLoading,
    ordersPage: orders.ordersPage,
    setOrdersPage: orders.setOrdersPage,
    ordersMeta: orders.ordersMeta,
    
    // Order details
    selectedOrder: orders.selectedOrder,
    setSelectedOrder: orders.setSelectedOrder,
    orderDetailsLoading: orders.orderDetailsLoading,
    orderDetailsError: orders.orderDetailsError,
    isReordering: orders.isReordering,
    handleOrderClick: orders.handleOrderClick,
    handleReOrder: orders.handleReOrder,
    
    // Currency
    currency,
    
    // Translation
    t,
  };
}
