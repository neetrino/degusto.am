'use client';

import { Button, Input } from '@shop/ui';
import { type ChangeEvent, useEffect, useState } from 'react';
import { useTranslation } from '../../../../lib/i18n-client';
import type { CategoryFormData } from '../types';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface AddCategoryModalProps {
  isOpen: boolean;
  formData: CategoryFormData;
  saving: boolean;
  imageUploading: boolean;
  onClose: () => void;
  onFormDataChange: (data: CategoryFormData) => void;
  onImageUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRemoveImage: () => void;
  onSubmit: () => Promise<void>;
}

type CategoryLocale = 'hy' | 'en' | 'ru';

const localeTabs: Array<{ key: CategoryLocale; label: string }> = [
  { key: 'hy', label: 'HY' },
  { key: 'en', label: 'EN' },
  { key: 'ru', label: 'RU' },
];

export function AddCategoryModal({
  isOpen,
  formData,
  saving,
  imageUploading,
  onClose,
  onFormDataChange,
  onImageUpload,
  onRemoveImage,
  onSubmit,
}: AddCategoryModalProps) {
  const { t } = useTranslation();
  const [activeLocale, setActiveLocale] = useState<CategoryLocale>('hy');
  const [isEntering, setIsEntering] = useState(false);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsEntering(false);
      const frame = window.requestAnimationFrame(() => {
        setIsEntering(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }
    setIsEntering(false);
    return undefined;
  }, [isOpen]);

  if (!isOpen) return null;

  const activeTitle =
    activeLocale === 'hy' ? formData.titleHy : activeLocale === 'en' ? formData.titleEn : formData.titleRu;

  const activePlaceholder =
    activeLocale === 'hy'
      ? 'Հայերեն անվանում'
      : activeLocale === 'en'
      ? 'English title'
      : 'Русское название';

  const localeCompletion: Record<CategoryLocale, boolean> = {
    hy: formData.titleHy.trim().length > 0,
    en: formData.titleEn.trim().length > 0,
    ru: formData.titleRu.trim().length > 0,
  };

  const handleLocaleTitleChange = (value: string) => {
    if (activeLocale === 'hy') {
      onFormDataChange({ ...formData, titleHy: value });
      return;
    }
    if (activeLocale === 'en') {
      onFormDataChange({ ...formData, titleEn: value });
      return;
    }
    onFormDataChange({ ...formData, titleRu: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label={t('admin.common.cancel')}
        className={`h-full flex-1 bg-[#1d392b]/40 backdrop-blur-[2px] transition-opacity duration-200 ${
          isEntering ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        disabled={saving}
      />
      <div
        className={`h-full w-full max-w-4xl overflow-y-auto border-l border-[#dde4de] bg-[#f7faf7] px-10 py-8 shadow-[-12px_0_40px_rgba(31,54,41,0.14)] transition-transform duration-300 ease-out ${
          isEntering ? 'translate-x-0' : 'translate-x-12'
        }`}
      >
        <h3 className="mb-2 text-[34px] font-bold leading-tight text-[#1d392b]">{t('admin.categories.addCategory')}</h3>
        <p className="mb-6 text-sm text-[#60766a]">Create category with localized titles</p>
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#dde4de] bg-white p-5 shadow-[0_8px_24px_rgba(24,46,34,0.06)]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-2xl border border-[#dbe4dc] bg-[#f3f7f4] p-1.5 shadow-sm">
              {localeTabs.map((localeTab) => {
                const isActive = activeLocale === localeTab.key;
                return (
                  <button
                    key={localeTab.key}
                    type="button"
                    onClick={() => setActiveLocale(localeTab.key)}
                    className={`inline-flex min-w-[86px] items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-base font-bold tracking-wide transition-all ${
                      isActive
                        ? 'border-[#1d392b] bg-[#1d392b] text-white shadow-md'
                        : 'border-[#d6ddd7] bg-white text-[#4d6458] hover:border-[#b9c7bc] hover:bg-[#f7faf7]'
                    }`}
                  >
                    {localeTab.label}
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        localeCompletion[localeTab.key] ? 'bg-[#7ce08f]' : isActive ? 'bg-white/50' : 'bg-[#c7d2c9]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <label className="mb-1 block text-sm font-medium text-[#365744]">
              {t('admin.categories.categoryTitle')} *
            </label>
            <Input
              type="text"
              value={activeTitle}
              onChange={(e) => handleLocaleTitleChange(e.target.value)}
              placeholder={activePlaceholder}
              className="h-12 w-full rounded-xl border border-[#dce3dd] bg-[#fcfdfc] text-base text-[#314f3f] shadow-sm focus:border-[#1f6c4b] focus:outline-none focus:ring-2 focus:ring-[#1f6c4b]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#365744] mb-1">
              {t('admin.categories.status')}
            </label>
            <select
              value={formData.published}
              onChange={(e) =>
                onFormDataChange({
                  ...formData,
                  published: e.target.value as CategoryFormData['published'],
                })
              }
              className="w-full rounded-xl border border-[#dce3dd] bg-[#fcfdfc] px-4 py-2.5 text-sm text-[#314f3f] shadow-sm focus:border-[#1f6c4b] focus:outline-none focus:ring-2 focus:ring-[#1f6c4b]/20"
            >
              <option value="published">{t('admin.categories.published')}</option>
              <option value="draft">{t('admin.categories.draft')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#365744] mb-2">
              {t('admin.categories.image')}
            </label>
            {formData.imageUrl ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={formData.imageUrl}
                    alt={t('admin.categories.imagePreview')}
                    className="h-24 w-24 rounded-lg border border-gray-300 object-cover"
                  />
                  <button
                    type="button"
                    onClick={onRemoveImage}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
                    title={t('admin.categories.removeImage')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : null}
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#dce3dd] bg-[#fcfdfc] px-4 py-2.5 text-sm text-[#314f3f] shadow-sm transition-colors hover:bg-[#f2f7f3]">
              {imageUploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                  {t('admin.categories.uploadingImage')}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {formData.imageUrl ? t('admin.categories.changeImage') : t('admin.categories.uploadImage')}
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void onImageUpload(event);
                }}
                disabled={imageUploading}
              />
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresSizes}
                onChange={(e) => onFormDataChange({ ...formData, requiresSizes: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-[#314f3f]">
                {t('admin.categories.requiresSizes')}
              </span>
            </label>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={
              saving ||
              imageUploading ||
              (!formData.titleHy.trim() && !formData.titleEn.trim() && !formData.titleRu.trim())
            }
            className="flex-1"
          >
            {saving ? t('admin.categories.creating') : t('admin.categories.createCategory')}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
          >
            {t('admin.common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}




