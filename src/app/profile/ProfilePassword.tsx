import type { FormEvent } from 'react';
import { Button, Input, Card } from '@shop/ui';

interface ProfilePasswordProps {
  passwordForm: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  setPasswordForm: (form: ProfilePasswordProps['passwordForm']) => void;
  savingPassword: boolean;
  onSave: (e: FormEvent) => void;
  t: (key: string) => string;
}

export function ProfilePassword({
  passwordForm,
  setPasswordForm,
  savingPassword,
  onSave,
  t,
}: ProfilePasswordProps) {
  return (
    <Card className="rounded-2xl border border-gray-200/80 p-5 shadow-none sm:p-7 lg:p-8">
      <div className="mb-8 border-b border-gray-100 pb-5 sm:mb-10 sm:pb-6">
        <h2 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">{t('profile.password.title')}</h2>
      </div>
      <form onSubmit={onSave} className="mx-auto max-w-xl space-y-6 lg:mx-0 lg:max-w-2xl">
        <Input
          label={t('profile.password.currentPassword')}
          type="password"
          value={passwordForm.currentPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
          placeholder={t('profile.password.currentPasswordPlaceholder')}
          required
        />
        <Input
          label={t('profile.password.newPassword')}
          type="password"
          value={passwordForm.newPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          placeholder={t('profile.password.newPasswordPlaceholder')}
          required
        />
        <Input
          label={t('profile.password.confirmPassword')}
          type="password"
          value={passwordForm.confirmPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          placeholder={t('profile.password.confirmPasswordPlaceholder')}
          required
        />
        <div className="pt-2 sm:pt-4">
          <Button type="submit" variant="primary" className="h-11 w-full rounded-xl sm:w-auto" disabled={savingPassword}>
            {savingPassword ? t('profile.password.changing') : t('profile.password.change')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
