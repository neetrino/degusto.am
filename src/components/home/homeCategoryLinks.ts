const COMBO_CATEGORY_TERMS = ['combo', 'կոմբո', 'комбо'] as const;

type HomeCategoryLinkInput = {
  slug: string;
  title: string;
};

function isComboCategory(category: HomeCategoryLinkInput): boolean {
  const slug = category.slug.trim().toLowerCase();
  const title = category.title.trim().toLowerCase();

  return COMBO_CATEGORY_TERMS.some((term) => slug === term || title.includes(term));
}

export function getHomeCategoryHref(category: HomeCategoryLinkInput): string {
  const targetPath = isComboCategory(category) ? '/combo' : '/shop';
  const slug = category.slug.trim();

  if (!slug) {
    return targetPath;
  }

  return `${targetPath}?category=${encodeURIComponent(slug)}`;
}
