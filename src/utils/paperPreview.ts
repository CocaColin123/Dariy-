interface PaperFitInput {
  viewportWidth: number;
  viewportHeight: number;
  pageWidth: number;
  pageHeight: number;
  paddingX: number;
  paddingY: number;
}

export function computePaperFitScale({
  viewportWidth,
  viewportHeight,
  pageWidth,
  pageHeight,
  paddingX,
  paddingY,
}: PaperFitInput) {
  const availableWidth = Math.max(1, viewportWidth - paddingX);
  const availableHeight = Math.max(1, viewportHeight - paddingY);
  return Math.min(availableWidth / pageWidth, availableHeight / pageHeight, 1);
}

export function shouldHandlePreviewPageKey(key: string, activeTagName?: string | null) {
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return false;
  return !['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTagName || '');
}
