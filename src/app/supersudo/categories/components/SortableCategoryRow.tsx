'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Button } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import {
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TD,
} from '../../constants/admin-table-classes';
import type { Category, CategoryWithLevel } from '../types';

interface SortableCategoryRowProps {
  category: CategoryWithLevel;
  dragEnabled: boolean;
  processImageUrl: (url: string | null | undefined) => string;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string, categoryTitle: string) => void;
}

export function SortableCategoryRow({
  category,
  dragEnabled,
  processImageUrl,
  onEdit,
  onDelete,
}: SortableCategoryRowProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    disabled: !dragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${ADMIN_TABLE_ROW} ${isDragging ? 'relative z-10 bg-white shadow-md' : ''}`}
    >
      <td className={`${ADMIN_TABLE_TD} w-10 whitespace-nowrap`}>
        {dragEnabled ? (
          <button
            type="button"
            ref={setActivatorNodeRef}
            className="flex h-8 w-8 cursor-grab items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t('admin.categories.dragToReorder')}
            title={t('admin.categories.dragToReorder')}
            disabled={!dragEnabled}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <span className="inline-block h-8 w-8" aria-hidden />
        )}
      </td>
      <td className={`${ADMIN_TABLE_TD} whitespace-nowrap`}>
        {category.imageUrl ? (
          <img
            src={processImageUrl(category.imageUrl)}
            alt={category.title}
            className="h-10 w-10 rounded border border-gray-200 object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded border border-dashed border-gray-300 text-xs text-gray-400">
            —
          </div>
        )}
      </td>
      <td className={`${ADMIN_TABLE_TD} text-left text-gray-900`}>
        <div className="text-sm font-medium">{category.title}</div>
        <div className="text-xs text-gray-500">{category.slug}</div>
      </td>
      <td className={`${ADMIN_TABLE_TD} whitespace-nowrap text-center`}>
        <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-[#e9f3ec] px-2.5 py-1 text-xs font-semibold text-[#2f8a57]">
          {category.productsCount ?? 0}
        </span>
      </td>
      <td className={`${ADMIN_TABLE_TD} whitespace-nowrap text-center`}>
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
            className="text-blue-600 hover:bg-blue-50 hover:text-blue-800"
            aria-label={t('admin.common.edit')}
            title={t('admin.common.edit')}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category.id, category.title)}
            className="text-red-600 hover:bg-red-50 hover:text-red-800"
            aria-label={t('admin.common.delete')}
            title={t('admin.common.delete')}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </td>
    </tr>
  );
}
