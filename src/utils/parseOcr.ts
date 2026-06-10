export interface ParsedEntry {
  date: string | null;
  dateLine: string;
  body: string;
}

export function parseOcr(text: string): ParsedEntry[] {
  const cleaned = text.replace(/根据您提供的图片[\s\S]*?如下[：:]\s*/g, '').trim();
  const parts = cleaned.split(/📅\s*/g).filter(Boolean);

  if (parts.length === 0 && cleaned.length > 0) {
    return [{ date: null, dateLine: '', body: cleaned }];
  }

  const entries: ParsedEntry[] = [];
  for (const part of parts) {
    const dateMatch = part.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
    let date: string | null = null;
    let dateLine = '';
    let body = part;

    if (dateMatch) {
      date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
      // Extract the full date header line (up to first newline, max ~40 chars)
      const nl = part.indexOf('\n');
      if (nl > 0 && nl < 60) {
        dateLine = part.slice(0, nl).trim();
        // Keep the date line in body, with a blank line after it
        body = dateLine + '\n' + part.slice(nl + 1).trim();
      } else {
        dateLine = dateMatch[0];
        body = part;
      }
    }

    if (body.length > 0) entries.push({ date, dateLine, body });
  }
  return entries;
}

export function extractLocation(text: string): string {
  const patterns = [
    /在([^\s,，。]{2,6}(?:公园|海边|山上|家里|店里|公司|学校|办公室|图书馆|咖啡店|电影院|车站|机场|酒店|罗森|便利店))/,
    /地点[：:]\s*(\S{2,10})/,
    /位置[：:]\s*(\S{2,10})/,
    /(?:罗森|3DM|食堂|宿舍|教室|图书馆|咖啡店|书店|地铁站|火车站|机场|医院|公园|海边|山上)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1] || m[0];
  }
  return '';
}
