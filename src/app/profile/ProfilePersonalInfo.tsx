import type { FormEvent } from 'react';
import { Button, Input, Card } from '@shop/ui';
import type { UserProfile } from './types';

interface ProfilePersonalInfoProps {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  setPersonalInfo: (info: ProfilePersonalInfoProps['personalInfo']) => void;
  savingPersonal: boolean;
  onSave: (e: FormEvent) => void;
  profile: UserProfile | null;
  t: (key: string) => string;
}

export function ProfilePersonalInfo({
  personalInfo,
  setPersonalInfo,
  savingPersonal,
  onSave,
  profile,
  t,
}: ProfilePersonalInfoProps) {
  return (
    <Card className="rounded-2xl border border-[#F66812]/20 p-5 shadow-none sm:p-7 lg:p-8">
      <div className="mb-8 border-b border-[#F66812]/15 pb-5 sm:mb-10 sm:pb-6">
        <h2 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">{t('profile.personal.title')}</h2>
      </div>
      <form onSubmit={onSave} className="mx-auto max-w-xl space-y-6 lg:mx-0 lg:max-w-2xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
          <Input
            label={t('profile.personal.firstName')}
            value={personalInfo.firstName}
            onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
            placeholder={t('profile.personal.firstNamePlaceholder')}
          />
          <Input
            label={t('profile.personal.lastName')}
            value={personalInfo.lastName}
            onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
            placeholder={t('profile.personal.lastNamePlaceholder')}
          />
        </div>
        <Input
          label={t('profile.personal.email')}
          type="email"
          value={personalInfo.email}
          onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
          placeholder={t('profile.personal.emailPlaceholder')}
        />
        <Input
          label={t('profile.personal.phone')}
          type="tel"
          value={personalInfo.phone}
          onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
          placeholder={t('profile.personal.phonePlaceholder')}
        />
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4 sm:pt-4">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl border-[#F66812]/40 text-[#F66812] hover:border-[#F66812] hover:bg-[#F66812]/10 sm:w-auto"
            onClick={() => {
              setPersonalInfo({
                firstName: profile?.firstName || '',
                lastName: profile?.lastName || '',
                email: profile?.email || '',
                phone: profile?.phone || '',
              });
            }}
          >
            {t('profile.personal.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="h-11 w-full rounded-xl !bg-[#F66812] hover:!bg-[#e45f10] focus:!ring-[#F66812] sm:w-auto"
            disabled={savingPersonal}
          >
            {savingPersonal ? t('profile.personal.saving') : t('profile.personal.save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
