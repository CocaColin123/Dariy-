export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`;
}

export function yearFromDate(dateStr: string): string {
  return dateStr.slice(0, 4);
}

export function monthFromDate(dateStr: string): string {
  const m = parseInt(dateStr.slice(5, 7), 10);
  return `${m}月`;
}
