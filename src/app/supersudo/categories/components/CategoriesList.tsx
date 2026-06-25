'use client';

import { useCallback, useMemo } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTranslation } from '../../../../lib/i18n-client';
import { showToast } from '../../../../components/Toast';
import { buildCategoryTree } from '../utils';
import { useCategoryReorderSave } from '../hooks/useCategoryReorderSave';
import { SortableCategoryRow } from './SortableCategoryRow';
import {
  ADMIN_TABLE,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_TH_CENTER,
  ADMIN_TABLE_THEAD,
} from '../../constants/admin-table-classes';
import type { Category, CategoryWithLevel } from '../types';

interface CategoriesListProps {
  categories: Category[];
  searchQuery: string;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string, categoryTitle: string) => void;
  onReorderApplied: (parentId: string | null, orderedIds: string[]) => void;
  onReorderFailed: () => Promise<void>;
}

function getSiblingIds(
  categories: CategoryWithLevel[],
  parentId: string | null,
): string[] {
  return categories
    .filter((category) => (category.parentId ?? null) === parentId)
    .map((category) => category.id);
}

export function CategoriesList({
  categories,
  searchQuery,
  onEdit,
  onDelete,
  onReorderApplied,
  onReorderFailed,
}: CategoriesListProps) {
  const { t } = useTranslation();
  const { scheduleReorderSave } = useCategoryReorderSave({
    onReorderApplied,
    onReorderFailed,
  });

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const dragEnabled = normalizedSearch.length === 0;

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const filteredCategories = useMemo(
    () =>
      normalizedSearch
        ? categoryTree.filter((category) =>
            category.title.toLowerCase().includes(normalizedSearch),
          )
        : categoryTree,
    [categoryTree, normalizedSearch],
  );

  const categoryById = useMemo(
    () => new Map(filteredCategories.map((category) => [category.id, category])),
    [filteredCategories],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const processImageUrl = useCallback((url: string | null | undefined) => {
    if (!url) return '';
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return url.startsWith('/') ? url : `/${url}`;
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !dragEnabled) {
        return;
      }

      const activeCategory = categoryById.get(String(active.id));
      const overCategory = categoryById.get(String(over.id));
      if (!activeCategory || !overCategory) {
        return;
      }

      const parentId = activeCategory.parentId ?? null;
      if ((overCategory.parentId ?? null) !== parentId) {
        showToast(t('admin.categories.reorderSameLevelOnly'), 'warning');
        return;
      }

      const siblingIds = getSiblingIds(filteredCategories, parentId);
      const oldIndex = siblingIds.indexOf(activeCategory.id);
      const newIndex = siblingIds.indexOf(overCategory.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return;
      }

      const orderedIds = arrayMove(siblingIds, oldIndex, newIndex);
      scheduleReorderSave(parentId, orderedIds);
    },
    [categoryById, dragEnabled, filteredCategories, scheduleReorderSave, t],
  );

  if (filteredCategories.length === 0) {
    return <p className="py-2 text-sm text-gray-500">{t('admin.categories.noCategories')}</p>;
  }

  return (
    <>
      {!dragEnabled ? (
        <p className="mb-3 text-xs text-gray-500">{t('admin.categories.reorderDisabledWhileSearching')}</p>
      ) : null}

      <div className={ADMIN_TABLE_OUTER_SCROLL}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className={ADMIN_TABLE}>
            <thead className={ADMIN_TABLE_THEAD}>
              <tr>
                <th className={`${ADMIN_TABLE_TH} w-10`} aria-hidden />
                <th className={ADMIN_TABLE_TH}>{t('admin.categories.image')}</th>
                <th className={ADMIN_TABLE_TH}>{t('admin.categories.categoryTitle')}</th>
                <th className={ADMIN_TABLE_TH}>{t('admin.categories.parentCategory')}</th>
                <th className={ADMIN_TABLE_TH_CENTER}>{t('admin.products.actions')}</th>
              </tr>
            </thead>
            <SortableContext
              items={filteredCategories.map((category) => category.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody className={ADMIN_TABLE_TBODY}>
                {filteredCategories.map((category) => {
                  const parentCategory = category.parentId
                    ? categories.find((item) => item.id === category.parentId)
                    : null;

                  return (
                    <SortableCategoryRow
                      key={category.id}
                      category={category}
                      parentTitle={parentCategory ? parentCategory.title : '-'}
                      dragEnabled={dragEnabled}
                      processImageUrl={processImageUrl}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  );
                })}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </div>
    </>
  );
}
