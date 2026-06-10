import { DIMENSIONS, type DimensionName, type TagDimension, type SubTag } from '../data/tagMapping';

export interface TagData {
  dimension: TagDimension;
  subTags: SubTag[];
  totalLogs: number;
}

export function useTagData() {
  function getDimensionData(dimensionName: string): TagData | null {
    const dim = DIMENSIONS.find(d => d.name === dimensionName);
    if (!dim) return null;
    return {
      dimension: dim,
      subTags: dim.subTags,
      totalLogs: dim.subTags.reduce((sum, st) => sum + st.count, 0),
    };
  }

  function getSubTagCount(dimensionName: string, subTagName: string): number {
    const dim = DIMENSIONS.find(d => d.name === dimensionName);
    if (!dim) return 0;
    return dim.subTags.find(s => s.name === subTagName)?.count ?? 0;
  }

  function getEntries(dimensionName: string, subTagName: string): string[] {
    const dim = DIMENSIONS.find(d => d.name === dimensionName);
    if (!dim) return [];
    return dim.subTags.find(s => s.name === subTagName)?.entries ?? [];
  }

  return {
    dimensions: DIMENSIONS,
    getDimensionData,
    getSubTagCount,
    getEntries,
    totalDiaries: DIMENSIONS[0].subTags.length, // 用时间维度的 3 做占位，实际 111
  };
}
