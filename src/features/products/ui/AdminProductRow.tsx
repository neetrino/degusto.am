"use client";

import { Copy, Pencil, Star, Trash2 } from "lucide-react";
import type { KeyboardEvent, MouseEvent } from "react";

import {
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TD_CHECK,
  ADMIN_TABLE_CHECKBOX,
} from "@/features/admin/ui/admin-table-classes";
import type { AdminProductListItem } from "@/features/products/application/list-admin-products";
import { formatMoneyAmount } from "@/lib/money/format";

type AdminProductRowProps = {
  locale: string;
  product: AdminProductListItem;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onFeatured: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onVisibility: () => void;
};

function stopRowAction(event: MouseEvent | KeyboardEvent): void {
  event.stopPropagation();
}

export function AdminProductRow({
  locale,
  product,
  selected,
  disabled,
  onToggle,
  onEdit,
  onFeatured,
  onDuplicate,
  onDelete,
  onVisibility,
}: AdminProductRowProps) {
  const isActive = product.status === "ACTIVE";
  const created = new Date(product.createdAt);
  const createdLabel = `${created.getDate()}/${created.getMonth() + 1}/${created.getFullYear()}`;

  function handleRowActivate(): void {
    if (disabled) return;
    onEdit();
  }

  return (
    <tr
      className={`${ADMIN_TABLE_ROW} cursor-pointer`}
      onClick={handleRowActivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleRowActivate();
        }
      }}
      tabIndex={disabled ? -1 : 0}
      aria-label={`Edit ${product.title}`}
    >
      <td className={ADMIN_TABLE_TD_CHECK} onClick={stopRowAction}>
        <input
          type="checkbox"
          className={ADMIN_TABLE_CHECKBOX}
          checked={selected}
          onChange={onToggle}
          disabled={disabled}
          aria-label={`Select ${product.title}`}
        />
      </td>
      <td className={ADMIN_TABLE_TD}>
        <div className="flex min-w-[200px] items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-[#e8e2d9]">
            {product.imageUrl ? (
              // Admin media may use storage hosts outside next/image config.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[10px] text-[#8a837a]">N/A</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-[#1f1a17]">{product.title}</p>
            <p className="truncate text-xs text-[#8a837a]">{product.slug}</p>
          </div>
        </div>
      </td>
      <td className={ADMIN_TABLE_TD}>
        <span className="text-[#1f1a17]">{product.stockOnHand} pcs</span>
      </td>
      <td className={ADMIN_TABLE_TD}>
        <div className="flex flex-col">
          <span className="font-medium text-[#1f1a17]">
            {formatMoneyAmount(product.priceAmount, "AMD", locale)}
          </span>
          {product.compareAtAmount != null &&
          product.compareAtAmount > product.priceAmount ? (
            <span className="text-xs text-[#8a837a] line-through">
              {formatMoneyAmount(product.compareAtAmount, "AMD", locale)}
            </span>
          ) : null}
        </div>
      </td>
      <td className={ADMIN_TABLE_TD}>
        <span className="line-clamp-2 max-w-[160px] text-[#5c564e]">
          {product.categoryLabels.length > 0
            ? product.categoryLabels.join(", ")
            : "—"}
        </span>
      </td>
      <td className={ADMIN_TABLE_TD} onClick={stopRowAction}>
        <button
          type="button"
          disabled={disabled}
          onClick={onFeatured}
          className="rounded p-1 text-[#8a837a] hover:bg-[#fff4eb] hover:text-amber-500"
          aria-label={
            product.isFeatured ? "Unfeature product" : "Feature product"
          }
        >
          <Star
            className={`h-4 w-4 ${product.isFeatured ? "fill-amber-400 text-amber-400" : ""}`}
          />
        </button>
      </td>
      <td className={ADMIN_TABLE_TD} onClick={stopRowAction}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded p-1.5 text-[#8a837a] hover:bg-[#fff4eb] hover:text-[#ff7f20]"
            aria-label={`Edit ${product.title}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onDuplicate}
            className="rounded p-1.5 text-[#8a837a] hover:bg-[#fff4eb] hover:text-[#ff7f20]"
            aria-label={`Duplicate ${product.title}`}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onDelete}
            className="rounded p-1.5 text-red-600 hover:bg-red-50"
            aria-label={`Delete ${product.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            disabled={disabled}
            onClick={onVisibility}
            className={`relative ml-1 h-5 w-9 rounded-full transition-colors ${
              isActive ? "bg-[#3e573d]" : "bg-[#d4ccc0]"
            }`}
            aria-label={isActive ? "Deactivate product" : "Activate product"}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                isActive ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </td>
      <td className={ADMIN_TABLE_TD}>
        <span className="text-xs text-[#8a837a]">{createdLabel}</span>
      </td>
    </tr>
  );
}
