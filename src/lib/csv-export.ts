import type { MetricsResponse, CardMetrics } from "@/app/api/metrics/route";

/**
 * Escapes a CSV field value (wraps in quotes if contains comma/quote/newline).
 */
function escape(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

const HEADERS = [
  "card_id",
  "title",
  "created_at",
  "started_at",
  "completed_at",
  "cycle_time_hours",
  "lead_time_hours",
  "stall_time_hours",
] as const;

/**
 * Generates a CSV string from metrics + card metadata.
 * @param metrics  - MetricsResponse from /api/metrics
 * @param cards    - CardMetrics[] included in MetricsResponse
 * @returns CSV string with header row + one row per card
 */
export function generateMetricsCSV(
  metrics: MetricsResponse,
  cards: CardMetrics[]
): string {
  const cycleMap = new Map(metrics.cycleTime.perCard.map((c) => [c.card_id, c.hours]));
  const leadMap = new Map(metrics.leadTime.perCard.map((c) => [c.card_id, c.hours]));
  const stallMap = new Map(
    metrics.stallTime.stalledCards.map((c) => [c.card_id, c.hoursStalled])
  );

  const rows = cards.map((card) => [
    escape(card.card_id),
    escape(card.title),
    escape(card.created_at),
    escape(card.started_at),
    escape(card.completed_at),
    escape(cycleMap.get(card.card_id) ?? null),
    escape(leadMap.get(card.card_id) ?? null),
    escape(stallMap.get(card.card_id) ?? null),
  ]);

  return [HEADERS.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
