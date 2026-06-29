/** Method badge colors — exact tints from the design handoff. */
export function methodColors(method: string): { fg: string; bg: string } {
  const map: Record<string, { fg: string; bg: string }> = {
    GET: { fg: "#0f9d8f", bg: "#d7f5f0" },
    POST: { fg: "#2f6bff", bg: "#e0e9ff" },
    PUT: { fg: "#d9810f", bg: "#fcedd4" },
    PATCH: { fg: "#8a5cff", bg: "#ece4ff" },
    DELETE: { fg: "#e5484d", bg: "#fde0e1" },
    HEAD: { fg: "#6a6781", bg: "#efeef5" },
  };
  return map[method.toUpperCase()] ?? { fg: "#6a6781", bg: "#efeef5" };
}
