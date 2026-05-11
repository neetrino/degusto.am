import { useState, type FormEvent } from 'react';
import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth/AuthContext';
import { useTranslation } from '../../../lib/i18n-client';

interface UseDeleteAccountProps {
  hasPassword: boolean;
  onError: (message: string) => void;
}

export function useDeleteAccount({ hasPassword, onError }: UseDeleteAccountProps) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async (e: FormEvent) => {
    e.preventDefault();
    onError('');
    if (!acknowledged) {
      onError(t('profile.deleteAccount.mustAcknowledge'));
      return;
    }
    setDeleting(true);
    try {
      const payload = hasPassword
        ? { password: password.trim() }
        : { confirmation: confirmation.trim() };
      await apiClient.post<{ success: boolean }>('/api/v1/users/account/delete', payload);
      logout();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      onError(errorMessage || t('profile.deleteAccount.failed'));
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setPassword('');
    setConfirmation('');
    setAcknowledged(false);
  };

  return {
    password,
    setPassword,
    confirmation,
    setConfirmation,
    acknowledged,
    setAcknowledged,
    deleting,
    handleDeleteAccount,
    resetForm,
  };
}
