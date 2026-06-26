'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { apiClient } from '../../../lib/api-client';
import { adminGet } from '@/lib/admin/admin-read-cache';
import { useTranslation } from '../../../lib/i18n-client';
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_CHECKBOX,
  ADMIN_TABLE_FOOTER,
  ADMIN_TABLE_FOOTER_ROUNDED_B,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_STATE_INSET,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TD_CHECK,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_TH_CHECK,
  ADMIN_TABLE_THEAD,
} from '../constants/admin-table-classes';
import { logger } from "@/lib/utils/logger";
import { useAdminDialogs } from '../context/AdminDialogsContext';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

interface MessagesResponse {
  data: Message[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface MessageDetailsModalProps {
  message: Message | null;
  onClose: () => void;
  t: (key: string) => string;
}

function MessageDetailsModal({ message, onClose, t }: MessageDetailsModalProps) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t('admin.messages.message')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label={t('admin.common.cancel')}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('admin.messages.name')}</p>
            <p className="mt-1 text-sm text-gray-900">{message.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('admin.messages.email')}</p>
            <p className="mt-1 text-sm text-gray-900 break-all">{message.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('admin.messages.subject')}</p>
            <p className="mt-1 text-sm text-gray-900 break-words">{message.subject}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('admin.messages.message')}</p>
            <p className="mt-1 max-h-72 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
              {message.message}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('admin.messages.date')}</p>
            <p className="mt-1 text-sm text-gray-900">{new Date(message.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('admin.common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { t } = useTranslation();
  const { confirm: confirmDialog } = useAdminDialogs();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<MessagesResponse['meta'] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/supersudo');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      logger.debug('📧 [ADMIN] Fetching messages...', { page });
      
      const response = await adminGet<MessagesResponse>('/api/v1/admin/messages', {
        params: {
          page: page.toString(),
          limit: '20',
        },
      });

      logger.debug('✅ [ADMIN] Messages fetched:', response);
      setMessages(response.data || []);
      setMeta(response.meta || null);
    } catch (err) {
      console.error('❌ [ADMIN] Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchMessages();
    }
     
  }, [isLoggedIn, isAdmin, fetchMessages]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (messages.length === 0) return;
    setSelectedIds((prev) => {
      const allIds = messages.map((m) => m.id);
      const hasAll = allIds.every((id) => prev.has(id));
      return hasAll ? new Set() : new Set(allIds);
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const isConfirmed = await confirmDialog({
      title: t('admin.common.delete'),
      message: t('admin.messages.deleteConfirm').replace('{count}', selectedIds.size.toString()),
      confirmText: t('admin.common.delete'),
      destructive: true,
    });
    if (!isConfirmed) return;
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const response = await fetch('/api/v1/admin/messages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ids }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Failed to delete messages');
      }
      
      setSelectedIds(new Set());
      await fetchMessages();
      alert(t('admin.messages.deletedSuccess'));
    } catch (err: any) {
      console.error('❌ [ADMIN] Bulk delete messages error:', err);
      alert(t('admin.messages.failedToDelete') + ': ' + (err.message || 'Unknown error'));
    } finally {
      setBulkDeleting(false);
    }
  };

  if (isLoading) {
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
        <Card
          className={loading || messages.length === 0 ? ADMIN_TABLE_STATE_INSET : ADMIN_TABLE_CARD}
        >
          {loading ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
              <p className="text-sm text-gray-600">{t('admin.messages.loadingMessages')}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-600">{t('admin.messages.noMessages')}</p>
            </div>
          ) : (
            <>
              <div className={ADMIN_TABLE_OUTER_SCROLL}>
                <table className={ADMIN_TABLE}>
                  <thead className={ADMIN_TABLE_THEAD}>
                    <tr>
                      <th className={ADMIN_TABLE_TH_CHECK}>
                        <input
                          type="checkbox"
                          className={ADMIN_TABLE_CHECKBOX}
                          aria-label={t('admin.messages.selectAll')}
                          checked={messages.length > 0 && messages.every(m => selectedIds.has(m.id))}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className={ADMIN_TABLE_TH}>{t('admin.messages.name')}</th>
                      <th className={ADMIN_TABLE_TH}>{t('admin.messages.email')}</th>
                      <th className={ADMIN_TABLE_TH}>{t('admin.messages.subject')}</th>
                      <th className={ADMIN_TABLE_TH}>{t('admin.messages.message')}</th>
                      <th className={ADMIN_TABLE_TH}>{t('admin.messages.date')}</th>
                    </tr>
                  </thead>
                  <tbody className={ADMIN_TABLE_TBODY}>
                    {messages.map((message) => (
                      <tr key={message.id} className={ADMIN_TABLE_ROW}>
                        <td className={ADMIN_TABLE_TD_CHECK}>
                          <div className="flex min-w-0 justify-center">
                            <input
                              type="checkbox"
                              className={ADMIN_TABLE_CHECKBOX}
                              aria-label={t('admin.messages.selectMessage').replace('{email}', message.email)}
                              checked={selectedIds.has(message.id)}
                              onChange={() => toggleSelect(message.id)}
                            />
                          </div>
                        </td>
                        <td className={`${ADMIN_TABLE_TD} whitespace-nowrap text-left font-medium text-gray-900`}>
                          {message.name}
                        </td>
                        <td className={`${ADMIN_TABLE_TD} whitespace-nowrap text-left text-gray-900`}>
                          {message.email}
                        </td>
                        <td className={`${ADMIN_TABLE_TD} text-left text-gray-900`}>
                          <button
                            type="button"
                            onClick={() => setSelectedMessage(message)}
                            className="w-full truncate text-left hover:text-blue-600"
                            title={message.subject}
                          >
                            {message.subject}
                          </button>
                        </td>
                        <td className={`${ADMIN_TABLE_TD} text-left text-gray-900`}>
                          <button
                            type="button"
                            onClick={() => setSelectedMessage(message)}
                            className="w-full max-w-md truncate text-left hover:text-blue-600"
                            title={message.message}
                          >
                            {message.message}
                          </button>
                        </td>
                        <td className={`${ADMIN_TABLE_TD} whitespace-nowrap text-left tabular-nums text-gray-600`}>
                          {new Date(message.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className={`${ADMIN_TABLE_FOOTER} flex items-center justify-between`}>
                  <div className="text-sm text-gray-700">
                    {t('admin.messages.showingPage').replace('{page}', meta.page.toString()).replace('{totalPages}', meta.totalPages.toString()).replace('{total}', meta.total.toString())}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      {t('admin.messages.previous')}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                      disabled={page === meta.totalPages}
                    >
                      {t('admin.messages.next')}
                    </Button>
                  </div>
                </div>
              )}
              <div className={`${ADMIN_TABLE_FOOTER_ROUNDED_B} flex items-center justify-between`}>
                <div className="text-sm text-gray-700">{t('admin.messages.selectedMessages').replace('{count}', selectedIds.size.toString())}</div>
                <Button
                  variant="outline"
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0 || bulkDeleting}
                >
                  {bulkDeleting ? t('admin.messages.deleting') : t('admin.messages.deleteSelected')}
                </Button>
              </div>
            </>
          )}
        </Card>
        <MessageDetailsModal message={selectedMessage} onClose={() => setSelectedMessage(null)} t={t} />
    </>
  );
}

