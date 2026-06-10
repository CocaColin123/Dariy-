declare const katex: any;

export function renderMath(text: string): string {
  if (typeof katex === 'undefined') return text;

  let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `$$${formula}$$`;
    }
  });

  result = result.replace(/\$(.+?)\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `$${formula}$`;
    }
  });

  return result;
}
