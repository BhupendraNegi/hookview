function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Syntax-highlight a JSON string to HTML, using the exact token colors from the
 * design prototype (keys #7c5cff, strings #0d9488, numbers #ea580c,
 * booleans #e11d48, null #9b97ad).
 */
export function highlightJson(json: string): string {
  return esc(json).replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let color = "#ea580c"; // number
      if (/^"/.test(match)) color = /:$/.test(match) ? "#7c5cff" : "#0d9488";
      else if (/true|false/.test(match)) color = "#e11d48";
      else if (/null/.test(match)) color = "#9b97ad";
      return `<span style="color:${color}">${match}</span>`;
    },
  );
}

/**
 * Given a raw request body, produce both display forms. If the body parses as
 * JSON we pretty-print + highlight it; otherwise we show the raw text as-is.
 */
export function renderBody(body: string): {
  isJson: boolean;
  prettyHtml: string;
  raw: string;
} {
  try {
    const parsed = JSON.parse(body);
    const pretty = JSON.stringify(parsed, null, 2);
    return { isJson: true, prettyHtml: highlightJson(pretty), raw: pretty };
  } catch {
    return { isJson: false, prettyHtml: esc(body), raw: body };
  }
}
