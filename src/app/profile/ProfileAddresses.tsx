import type { FormEvent } from 'react';
import { Button, Input, Card } from '@shop/ui';
import type { Address, UserProfile } from './types';

interface ProfileAddressesProps {
  profile: UserProfile | null;
  showAddressForm: boolean;
  setShowAddressForm: (show: boolean) => void;
  editingAddress: Address | null;
  addressForm: Address;
  setAddressForm: (address: Address) => void;
  savingAddress: boolean;
  onSave: (e: FormEvent) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
  onEdit: (address: Address) => void;
  onResetForm: () => void;
  t: (key: string) => string;
}

export function ProfileAddresses({
  profile,
  showAddressForm,
  setShowAddressForm,
  editingAddress,
  addressForm,
  setAddressForm,
  savingAddress,
  onSave,
  onDelete,
  onSetDefault,
  onEdit,
  onResetForm,
  t,
}: ProfileAddressesProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <Card className="rounded-2xl border border-gray-200/80 p-5 shadow-none sm:p-7 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-5 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
          <h2 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">{t('profile.addresses.title')}</h2>
          <Button
            variant="primary"
            className="h-11 w-full shrink-0 rounded-xl sm:w-auto"
            onClick={() => {
              onResetForm();
              setShowAddressForm(!showAddressForm);
            }}
          >
            {showAddressForm ? t('profile.addresses.form.cancel') : `+ ${t('profile.addresses.addNew')}`}
          </Button>
        </div>

        {showAddressForm && (
          <form onSubmit={onSave} className="mb-8 space-y-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-4 sm:mb-10 sm:p-6">
            <h3 className="text-base font-semibold text-gray-900">
              {editingAddress ? t('profile.addresses.form.editTitle') : t('profile.addresses.form.addTitle')}
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
              <Input
                label={t('profile.addresses.form.addressLine1')}
                value={addressForm.addressLine1}
                onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                required
              />
              <Input
                label={t('profile.addresses.form.city')}
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                required
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={addressForm.isDefault || false}
                onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-700">{t('profile.addresses.form.isDefault')}</span>
            </label>
            <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl sm:w-auto"
                onClick={() => {
                  setShowAddressForm(false);
                  onResetForm();
                }}
              >
                {t('profile.addresses.form.cancel')}
              </Button>
              <Button type="submit" variant="primary" className="h-11 w-full rounded-xl sm:w-auto" disabled={savingAddress}>
                {savingAddress ? t('profile.addresses.form.saving') : editingAddress ? t('profile.addresses.form.update') : t('profile.addresses.form.add')}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-4 sm:space-y-5">
          {profile?.addresses && profile.addresses.length > 0 ? (
            profile.addresses.map((address, index) => (
              <div
                key={address.id || address._id || index}
                className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 lg:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {address.isDefault && (
                        <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                          {t('profile.addresses.default')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-800 sm:text-base">{address.addressLine1}</p>
                    <p className="text-sm text-gray-800 sm:text-base">{address.city}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4 lg:border-0 lg:pt-0">
                    {!address.isDefault && (
                      <Button variant="outline" size="sm" className="min-h-9 flex-1 rounded-xl sm:flex-initial" onClick={() => onSetDefault((address.id || address._id)!)}>
                        {t('profile.addresses.setDefault')}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="min-h-9 flex-1 rounded-xl sm:flex-initial" onClick={() => onEdit(address)}>
                      {t('profile.addresses.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-9 flex-1 rounded-xl text-red-600 hover:border-red-300 hover:text-red-700 sm:flex-initial"
                      onClick={() => onDelete((address.id || address._id)!)}
                    >
                      {t('profile.addresses.delete')}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="py-12 text-center text-sm text-gray-500 sm:py-16">{t('profile.addresses.noAddresses')}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
