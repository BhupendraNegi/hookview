/**
 * One captured webhook request, as stored in Redis and returned to the client.
 *
 * `body` is the RAW request body, stored verbatim — we never reject or
 * normalize it. `source` and `preview` are derived at capture time purely for
 * the UI (the wire data is everything else).
 */
export interface CapturedRequest {
  id: string;
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: string | null;
  contentType: string;
  timestamp: number;
  source: string;
  preview: string;
}
