import { describe, expect, it } from 'vitest';
import { computePaperFitScale, shouldHandlePreviewPageKey } from './paperPreview';

describe('computePaperFitScale', () => {
  it('fits the page to the smaller viewport dimension without upscaling', () => {
    expect(computePaperFitScale({
      viewportWidth: 1000,
      viewportHeight: 700,
      pageWidth: 800,
      pageHeight: 1000,
      paddingX: 80,
      paddingY: 80,
    })).toBeCloseTo(0.62, 2);
  });

  it('does not scale above 1 when the viewport is larger than the page', () => {
    expect(computePaperFitScale({
      viewportWidth: 1400,
      viewportHeight: 1400,
      pageWidth: 800,
      pageHeight: 1000,
      paddingX: 80,
      paddingY: 80,
    })).toBe(1);
  });
});

describe('shouldHandlePreviewPageKey', () => {
  it('ignores arrow keys while focus is in text-editing controls', () => {
    expect(shouldHandlePreviewPageKey('ArrowRight', 'TEXTAREA')).toBe(false);
    expect(shouldHandlePreviewPageKey('ArrowLeft', 'INPUT')).toBe(false);
    expect(shouldHandlePreviewPageKey('ArrowRight', 'SELECT')).toBe(false);
  });

  it('handles horizontal arrow keys outside editing controls', () => {
    expect(shouldHandlePreviewPageKey('ArrowRight', 'BUTTON')).toBe(true);
    expect(shouldHandlePreviewPageKey('ArrowLeft', 'DIV')).toBe(true);
    expect(shouldHandlePreviewPageKey('ArrowUp', 'DIV')).toBe(false);
  });
});
