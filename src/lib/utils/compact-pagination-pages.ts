/**
 * Page numbers and ellipsis markers for a compact numeric pagination control.
 * Mirrors the windowing logic used on the legacy products catalog.
 */
export function getCompactPaginationPages(
  totalPages: number,
  currentPage: number
): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const boundarySet = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  const sorted = Array.from(boundarySet)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = sorted[index - 1];
    if (index > 0 && current !== undefined && previous !== undefined && current - previous > 1) {
      out.push('ellipsis');
    }
    if (current !== undefined) {
      out.push(current);
    }
  }
  return out;
}
