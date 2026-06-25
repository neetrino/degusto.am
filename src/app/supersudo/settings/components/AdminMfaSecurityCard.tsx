'use client';

import { useState } from 'react';
import { Card, Button } from '@shop/ui';
import { apiClient } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';

type MfaSetupState = {
  secret: string;
  otpauthUrl: string;
} | null;

type AdminMfaSecurityCardProps = {
  mfaEnabled: boolean;
  onStatusChange: () => void;
};

export function AdminMfaSecurityCard({ mfaEnabled, onStatusChange }: AdminMfaSecurityCardProps) {
  const { t } = useTranslation();
  const [setup, setSetup] = useState<MfaSetupState>(null);
  const [code, setCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const beginSetup = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await apiClient.post<MfaSetupState>('/api/v1/auth/mfa/setup', {});
      setSetup(response);
    } catch {
      setError(t('login.mfa.setupFailed'));
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async () => {
    if (!setup?.secret) {
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await apiClient.put('/api/v1/auth/mfa/setup', { secret: setup.secret, code });
      setSetup(null);
      setCode('');
      onStatusChange();
    } catch {
      setError(t('login.mfa.invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  const disableMfa = async () => {
    setError(null);
    setLoading(true);
    try {
      await apiClient.post('/api/v1/auth/mfa/disable', { code: disableCode });
      setDisableCode('');
      onStatusChange();
    } catch {
      setError(t('login.mfa.invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 p-6">
      <h2 className="mb-2 text-lg font-semibold text-gray-900">{t('login.mfa.adminTitle')}</h2>
      <p className="mb-4 text-sm text-gray-600">{t('login.mfa.adminDescription')}</p>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      {mfaEnabled ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-emerald-700">{t('login.mfa.enabled')}</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder={t('login.mfa.codeLabel')}
            className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <Button type="button" variant="outline" disabled={loading || disableCode.length !== 6} onClick={disableMfa}>
            {t('login.mfa.disable')}
          </Button>
        </div>
      ) : setup ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">{t('login.mfa.scanHint')}</p>
          <p className="break-all rounded bg-gray-50 p-2 font-mono text-xs">{setup.otpauthUrl}</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder={t('login.mfa.codeLabel')}
            className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button type="button" disabled={loading || code.length !== 6} onClick={confirmSetup}>
              {t('login.mfa.confirmSetup')}
            </Button>
            <Button type="button" variant="outline" disabled={loading} onClick={() => setSetup(null)}>
              {t('login.mfa.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" disabled={loading} onClick={beginSetup}>
          {t('login.mfa.enable')}
        </Button>
      )}
    </Card>
  );
}
