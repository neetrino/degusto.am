'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { apiClient } from '../../../lib/api-client';
import {
  adminGet,
  invalidateAdminReadCacheKey,
  buildAdminReadCacheKey,
} from '@/lib/admin/admin-read-cache';
import { useTranslation } from '../../../lib/i18n-client';
import { logger } from "@/lib/utils/logger";
import { useAdminDialogs } from '../context/AdminDialogsContext';

interface DeliveryLocation {
  id?: string;
  country: string;
  city: string;
  price: number;
}

interface DeliverySettings {
  locations: DeliveryLocation[];
}

const DEFAULT_DELIVERY_COUNTRY = 'Հայաստան';

export default function DeliveryPage() {
  const { t } = useTranslation();
  const { confirm: confirmDialog } = useAdminDialogs();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/supersudo');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const fetchDeliverySettings = useCallback(async (options?: { force?: boolean }) => {
    try {
      setLoading(true);
      logger.debug('🚚 [ADMIN] Fetching delivery settings...');
      const data = await adminGet<DeliverySettings>('/api/v1/admin/delivery', options);
      setLocations(data.locations || []);
      logger.debug('✅ [ADMIN] Delivery settings loaded:', data);
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error fetching delivery settings:', err);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      void fetchDeliverySettings();
    }
  }, [isLoggedIn, isAdmin, fetchDeliverySettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const normalizedLocations = locations.map((location) => ({
        ...location,
        country: DEFAULT_DELIVERY_COUNTRY,
      }));
      logger.debug('🚚 [ADMIN] Saving delivery settings...', { locations: normalizedLocations });
      await apiClient.put('/api/v1/admin/delivery', { locations: normalizedLocations });
      alert(t('admin.delivery.savedSuccess'));
      logger.debug('✅ [ADMIN] Delivery settings saved');
      setEditingId(null);
      invalidateAdminReadCacheKey(buildAdminReadCacheKey('/api/v1/admin/delivery'));
      await fetchDeliverySettings({ force: true });
    } catch (err: any) {
      console.error('❌ [ADMIN] Error saving delivery settings:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save delivery settings';
      alert(t('admin.delivery.errorSaving').replace('{message}', errorMessage));
    } finally {
      setSaving(false);
    }
  };

  const handleAddLocation = () => {
    setLocations([...locations, { country: DEFAULT_DELIVERY_COUNTRY, city: '', price: 1000 }]);
    setEditingId(`new-${Date.now()}`);
  };

  const handleUpdateLocation = (index: number, field: keyof DeliveryLocation, value: string | number) => {
    const updated = [...locations];
    updated[index] = { ...updated[index], [field]: value };
    setLocations(updated);
  };

  const handleDeleteLocation = async (index: number) => {
    const isConfirmed = await confirmDialog({
      title: t('admin.common.delete'),
      message: t('admin.delivery.deleteLocation'),
      confirmText: t('admin.common.delete'),
      destructive: true,
    });
    if (!isConfirmed) {
      return;
    }

    const updated = locations.filter((_, i) => i !== index);
    setLocations(updated);
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <>
            <Card className="mb-6 rounded-xl border border-[#f2d8c6] bg-gradient-to-br from-[#fff8f2] via-white to-[#eef8f1] p-6 shadow-[0_8px_24px_rgba(245,104,20,0.08)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{t('admin.delivery.deliveryPricesByLocation')}</h2>
                <Button
                  variant="primary"
                  className="bg-gradient-to-r from-[#f66812] to-[#2f7d4a] hover:from-[#e85d0b] hover:to-[#25653c]"
                  onClick={handleAddLocation}
                  disabled={saving}
                >
                  {t('admin.delivery.addLocation')}
                </Button>
              </div>
              
              {locations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('admin.delivery.noLocations')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {locations.map((location, index) => (
                    <div key={index} className="rounded-lg border border-[#f1d7c6] bg-gradient-to-r from-[#fff4ea] to-[#edf8f1] p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('admin.delivery.city')}
                          </label>
                          <input
                            type="text"
                            value={location.city}
                            onChange={(e) => handleUpdateLocation(index, 'city', e.target.value)}
                            className="w-full rounded-md border border-[#ebd3c1] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f7bc95]"
                            placeholder={t('admin.delivery.cityPlaceholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('admin.delivery.price')}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={location.price}
                              onChange={(e) => handleUpdateLocation(index, 'price', parseFloat(e.target.value) || 0)}
                            className="flex-1 rounded-md border border-[#ebd3c1] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f7bc95]"
                            placeholder={t('admin.delivery.pricePlaceholder')}
                            min="0"
                            step="100"
                          />
                            <button
                              onClick={() => handleDeleteLocation(index)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                              disabled={saving}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="primary"
                className="bg-gradient-to-r from-[#f66812] to-[#2f7d4a] hover:from-[#e85d0b] hover:to-[#25653c]"
                onClick={handleSave}
                disabled={saving || locations.length === 0}
              >
                {saving ? t('admin.delivery.saving') : t('admin.delivery.saveSettings')}
              </Button>
              <Button
                variant="ghost"
                className="text-[#1f5f44] hover:bg-[#fff3ea] hover:text-[#d7590e]"
                onClick={() => router.push('/supersudo')}
                disabled={saving}
              >
                {t('admin.delivery.cancel')}
              </Button>
            </div>
    </>
  );
}

