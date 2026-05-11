'use client';

import type { MouseEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, type CurrencyCode } from '../../lib/currency';

export interface CompareProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
  image: string | null;
  inStock: boolean;
  brand: {
    id: string;
    name: string;
  } | null;
  description?: string;
  categories?: Array<{ id: string; slug: string; title: string }>;
}

export interface CompareProductsTableProps {
  products: CompareProduct[];
  currency: CurrencyCode;
  addingToCart: Set<string>;
  t: (key: string) => string;
  onRemove: (e: MouseEvent, productId: string) => void;
  onAddToCart: (e: MouseEvent, product: CompareProduct) => void;
}

export function CompareProductsTable({
  products,
  currency,
  addingToCart,
  t,
  onRemove,
  onAddToCart,
}: CompareProductsTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 min-w-[150px] sticky left-0 bg-gray-50 z-10">
                {t('common.compare.characteristic')}
              </th>
              {products.map((product) => (
                <th
                  key={product.id}
                  className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-[220px] relative"
                >
                  <button
                    type="button"
                    onClick={(e) => onRemove(e, product.id)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                    title={t('common.buttons.remove')}
                    aria-label={t('common.buttons.remove')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                {t('common.compare.image')}
              </td>
              {products.map((product) => (
                <td key={product.id} className="px-4 py-4 text-center">
                  <Link href={`/products/${product.slug}`} className="inline-block">
                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg overflow-hidden relative">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-cover"
                          sizes="128px"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">{t('common.messages.noImage')}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </td>
              ))}
            </tr>

            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                {t('common.compare.name')}
              </td>
              {products.map((product) => (
                <td key={product.id} className="px-4 py-4">
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors block text-center"
                  >
                    {product.title}
                  </Link>
                </td>
              ))}
            </tr>

            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                {t('common.compare.category')}
              </td>
              {products.map((product) => (
                <td key={product.id} className="px-4 py-4 text-center text-sm text-gray-600">
                  {product.categories && product.categories.length > 0
                    ? product.categories.map((c) => c.title).filter(Boolean).join(', ')
                    : '-'}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                {t('common.compare.brand')}
              </td>
              {products.map((product) => (
                <td key={product.id} className="px-4 py-4 text-center text-sm text-gray-600">
                  {product.brand ? product.brand.name : '-'}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                {t('common.compare.price')}
              </td>
              {products.map((product) => (
                <td key={product.id} className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-lg font-bold text-gray-900 select-none">
                      {formatPrice(product.price, currency)}
                    </p>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <p className="text-sm text-gray-500 line-through select-none">
                        {formatPrice(product.originalPrice, currency)}
                      </p>
                    )}
                    {!product.originalPrice &&
                      product.compareAtPrice &&
                      product.compareAtPrice > product.price && (
                        <p className="text-sm text-gray-500 line-through select-none">
                          {formatPrice(product.compareAtPrice, currency)}
                        </p>
                      )}
                  </div>
                </td>
              ))}
            </tr>

            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                {t('common.compare.availability')}
              </td>
              {products.map((product) => (
                <td key={product.id} className="px-4 py-4 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.inStock ? t('common.stock.inStock') : t('common.stock.outOfStock')}
                  </span>
                </td>
              ))}
            </tr>

            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 text-sm font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                {t('common.compare.actions')}
              </td>
              {products.map((product) => (
                <td key={product.id} className="px-4 py-4 text-center">
                  <div className="flex flex-col gap-2 items-center">
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {t('common.compare.viewDetails')}
                    </Link>
                    {product.inStock && (
                      <button
                        type="button"
                        onClick={(e) => onAddToCart(e, product)}
                        disabled={addingToCart.has(product.id)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingToCart.has(product.id)
                          ? t('common.messages.adding')
                          : t('common.buttons.addToCart')}
                      </button>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
