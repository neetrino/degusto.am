import { useState, useRef } from 'react';
import type {
  Brand,
  Category,
  Attribute,
  GeneratedVariant,
  PendingVariantHydration,
} from '../types';
import type { CurrencyCode } from '@/lib/currency';
import type { ProductAddFormData } from '../utils/productFormDataBuilder';
import { getEmptyProductFormData } from '../utils/productFormDataBuilder';

interface SimpleProductFormFields {
  price: string;
  compareAtPrice: string;
  sku: string;
  quantity: string;
}

export function useProductFormState() {
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [formData, setFormData] = useState<ProductAddFormData>(() => getEmptyProductFormData());
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [brandsExpanded, setBrandsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const variantImageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const attributesDropdownRef = useRef<HTMLDivElement | null>(null);
  const [attributesDropdownOpen, setAttributesDropdownOpen] = useState(false);
  const [colorImageTarget, setColorImageTarget] = useState<{ variantId: string; colorValue: string } | null>(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [useNewBrand, setUseNewBrand] = useState(false);
  const [useNewCategory, setUseNewCategory] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newSizeName, setNewSizeName] = useState('');
  const [addingColor, setAddingColor] = useState(false);
  const [addingSize, setAddingSize] = useState(false);
  const [colorMessage, setColorMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sizeMessage, setSizeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>('AMD');
  const [productType, setProductType] = useState<'simple' | 'variable'>('variable');
  const [simpleProductData, setSimpleProductData] = useState<SimpleProductFormFields>({
    price: '',
    compareAtPrice: '',
    sku: '',
    quantity: '',
  });
  const [selectedAttributesForVariants, setSelectedAttributesForVariants] = useState<Set<string>>(new Set());
  const [selectedAttributeValueIds, setSelectedAttributeValueIds] = useState<Record<string, string[]>>({});
  const [openValueModal, setOpenValueModal] = useState<{ variantId: string; attributeId: string } | null>(null);
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);
  const [hasVariantsToLoad, setHasVariantsToLoad] = useState(false);
  /** Bumps to re-fetch the same product from the API (e.g. tab visible again). */
  const [productFetchNonce, setProductFetchNonce] = useState(0);
  /** Variants + attribute ids from last GET, consumed by variant-builder conversion. */
  const [pendingVariantHydration, setPendingVariantHydration] = useState<PendingVariantHydration | null>(
    null
  );
  /** True after brands/categories/attributes reference fetch finishes (success or error). */
  const [referenceCatalogReady, setReferenceCatalogReady] = useState(false);

  return {
    // Loading states
    loading,
    setLoading,
    loadingProduct,
    setLoadingProduct,
    // Data states
    brands,
    setBrands,
    categories,
    setCategories,
    attributes,
    setAttributes,
    // Form data
    formData,
    setFormData,
    // UI states
    categoriesExpanded,
    setCategoriesExpanded,
    brandsExpanded,
    setBrandsExpanded,
    attributesDropdownOpen,
    setAttributesDropdownOpen,
    // Refs
    fileInputRef,
    variantImageInputRefs,
    attributesDropdownRef,
    // Image states
    colorImageTarget,
    setColorImageTarget,
    imageUploadLoading,
    setImageUploadLoading,
    imageUploadError,
    setImageUploadError,
    // New entity states
    newBrandName,
    setNewBrandName,
    newCategoryName,
    setNewCategoryName,
    useNewBrand,
    setUseNewBrand,
    useNewCategory,
    setUseNewCategory,
    // Color/Size management
    newColorName,
    setNewColorName,
    newSizeName,
    setNewSizeName,
    addingColor,
    setAddingColor,
    addingSize,
    setAddingSize,
    colorMessage,
    setColorMessage,
    sizeMessage,
    setSizeMessage,
    // Currency and product type
    defaultCurrency,
    setDefaultCurrency,
    productType,
    setProductType,
    simpleProductData,
    setSimpleProductData,
    // Variant builder states
    selectedAttributesForVariants,
    setSelectedAttributesForVariants,
    selectedAttributeValueIds,
    setSelectedAttributeValueIds,
    openValueModal,
    setOpenValueModal,
    generatedVariants,
    setGeneratedVariants,
    hasVariantsToLoad,
    setHasVariantsToLoad,
    productFetchNonce,
    setProductFetchNonce,
    pendingVariantHydration,
    setPendingVariantHydration,
    referenceCatalogReady,
    setReferenceCatalogReady,
  };
}

