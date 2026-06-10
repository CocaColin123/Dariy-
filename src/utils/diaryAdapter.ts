import type { DiaryEntry } from '../types/diary';

export type TimelineLayoutType = 'lead' | 'lead_text' | 'quote' | 'wide' | 'standard' | 'poster' | 'poster_square' | 'poster_circle' | 'editorial' | 'photo_stack';

export interface TimelineData {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  wordCount: number;
  layout: TimelineLayoutType;
  tags?: string[];
  hasImage?: boolean;
  featured?: boolean;
  images?: string[];
  coverImage?: string;
  layoutOverride?: boolean;
}

export function mapDiaryEntriesToTimeline(entries: DiaryEntry[]): TimelineData[] {
  return entries.map((entry, index) => {
    const isLocked = entry.meta.locked || (entry.body || '').startsWith('[LOCKED:');
    const rawBody = isLocked ? '' : (entry.body || '');
    const wordCount = isLocked ? 0 : rawBody.length;
    let layout: TimelineLayoutType = 'standard';
    let excerpt = isLocked ? '[LOCKED]' : (rawBody.substring(0, 150).replace(/\n/g, ' ') + (wordCount > 150 ? '...' : ''));

    // auto-layout
    const imgCount = entry.images?.length || 0;
    if (wordCount > 0 && wordCount < 100) {
      layout = 'quote';
      excerpt = rawBody;
    } else if (wordCount > 1000 || index === 0) {
      layout = imgCount > 0 ? 'lead' : 'lead_text';
    } else if (imgCount >= 2) {
      layout = 'photo_stack';
    } else if (imgCount === 1 && wordCount > 200) {
      layout = 'editorial';
    } else if (index % 10 === 0 && wordCount > 400) {
      layout = 'editorial';
    } else if (index % 9 === 0 && wordCount > 200) {
      layout = 'poster_square';
    } else if (index % 7 === 3 && wordCount > 150) {
      layout = 'poster_circle';
    } else if (index % 5 === 0 && wordCount > 300) {
      layout = 'poster';
    } else if (index % 8 === 0 && wordCount > 300) {
      layout = 'wide';
    }

    // manual override takes priority
    const finalLayout = (entry.meta?.layoutOverride as TimelineLayoutType) || layout;
    const isOverridden = !!entry.meta?.layoutOverride;

    // cover image switching
    let finalImages = [...(entry.images || [])];
    let coverImage = finalImages[0] || undefined;
    if (
      entry.meta?.coverImageIndex !== undefined &&
      entry.meta.coverImageIndex >= 0 &&
      entry.meta.coverImageIndex < finalImages.length
    ) {
      const chosen = finalImages.splice(entry.meta.coverImageIndex, 1)[0];
      finalImages.unshift(chosen);
      coverImage = chosen;
    }

    return {
      id: entry.filePath || `entry-${index}`,
      title: entry.meta?.title || 'Untitled',
      excerpt,
      date: entry.meta?.date || new Date().toISOString(),
      wordCount,
      layout: finalLayout,
      tags: entry.meta?.tags,
      hasImage: finalImages.length > 0,
      featured: finalLayout === 'lead' || finalLayout === 'lead_text',
      images: finalImages,
      coverImage,
      layoutOverride: isOverridden,
    };
  });
}
