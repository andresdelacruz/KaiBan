import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Internal DB row type (uses action/from_value/to_value schema) */
type Tx = {
  id: string;
  card_id: string;
  board_id: string;
  action: string;
  from_value: string | null;
  to_value: string | null;
  created_at: string;
  actor: string | null;
};

/** Public Transaction type used by metrics-calculator and tests */
export type Transaction = {
  id: string;
  card_id: string;
  board_id: string;
  from_column_id: string | null;
  to_column_id: string | null;
  created_at: string;
  user_id: string | null;
};

/** Per-card metadata included in API response for CSV export */
export type CardMetrics = {
  card_id: string;
  title: string;
  created_at: string | null;
  started_at: string | null;
  completed_at: string | null;
};

export type MetricsResponse = {
  cycleTime: {
    average: number;
    perCard: { card_id: string; hours: number }[];
  };
  leadTime: {
    average: number;
    perCard: { card_id: string; hours: number }[];
    columnBreakdown: { column: string; average: number }[];
  };
  throughput: {
    daily: { date: string; count: number }[];
    average: number;
  };
  stallTime: {
    stalledCards: { card_id: string; stalledSince: string; hoursStalled: number }[];
    count: number;
  };
  cards: CardMetrics[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId");

  if (!boardId) {
    return NextResponse.json({ error: "boardId is required" }, { status: 400 });
  }

  // Optional date range filters (ISO date strings, e.g. "2026-01-01")
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const fromDate = fromParam ? new Date(fromParam) : null;
  const toDate = toParam ? new Date(`${toParam}T23:59:59.999Z`) : null;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Build query
  let query = supabase
    .from("transactions")
    .select("id, card_id, board_id, action, from_value, to_value, created_at, actor")
    .eq("board_id", boardId)
    .eq("action", "card_moved")
    .order("created_at", { ascending: true });

  if (fromDate) query = query.gte("created_at", fromDate.toISOString());
  if (toDate) query = query.lte("created_at", toDate.toISOString());

  const { data: transactions, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const txs: Tx[] = transactions ?? [];

  // Group by card
  const cardTxMap = new Map<string, Tx[]>();
  for (const tx of txs) {
    if (!tx.card_id) continue;
    if (!cardTxMap.has(tx.card_id)) cardTxMap.set(tx.card_id, []);
    cardTxMap.get(tx.card_id)!.push(tx);
  }

  // Fetch card titles for all card_ids
  const cardIds = [...cardTxMap.keys()];
  const { data: cardRows } = cardIds.length
    ? await supabase
        .from("cards")
        .select("id, title, created_at")
        .in("id", cardIds)
    : { data: [] };

  const cardTitleMap = new Map<string, { title: string; created_at: string }>(
    (cardRows ?? []).map((c: { id: string; title: string; created_at: string }) => [
      c.id,
      { title: c.title, created_at: c.created_at },
    ])
  );

  // ── Cycle Time: from first move TO "In Progress" to move TO "Done" ──
  const cyclePerCard: { card_id: string; hours: number }[] = [];
  for (const [cardId, cardTxs] of cardTxMap.entries()) {
    const startTx = cardTxs.find(
      (t) =>
        t.to_value?.toLowerCase().includes("progress") ||
        t.to_value?.toLowerCase() === "doing"
    );
    const endTx = cardTxs.find((t) => t.to_value?.toLowerCase() === "done");
    if (startTx && endTx) {
      const hours =
        (new Date(endTx.created_at).getTime() - new Date(startTx.created_at).getTime()) /
        3_600_000;
      if (hours >= 0) cyclePerCard.push({ card_id: cardId, hours: parseFloat(hours.toFixed(2)) });
    }
  }
  const cycleAvg =
    cyclePerCard.length > 0
      ? parseFloat(
          (cyclePerCard.reduce((s, c) => s + c.hours, 0) / cyclePerCard.length).toFixed(2)
        )
      : 0;

  // ── Lead Time: from first transaction to Done ──
  const leadPerCard: { card_id: string; hours: number }[] = [];
  const columnDuration = new Map<string, number[]>();

  for (const [cardId, cardTxs] of cardTxMap.entries()) {
    const firstTx = cardTxs[0];
    const doneTx = cardTxs.find((t) => t.to_value?.toLowerCase() === "done");
    if (firstTx && doneTx) {
      const hours =
        (new Date(doneTx.created_at).getTime() - new Date(firstTx.created_at).getTime()) /
        3_600_000;
      if (hours >= 0) leadPerCard.push({ card_id: cardId, hours: parseFloat(hours.toFixed(2)) });
    }

    // Per-column time
    for (let i = 0; i < cardTxs.length - 1; i++) {
      const curr = cardTxs[i];
      const next = cardTxs[i + 1];
      if (curr.to_value) {
        const dur =
          (new Date(next.created_at).getTime() - new Date(curr.created_at).getTime()) /
          3_600_000;
        if (!columnDuration.has(curr.to_value)) columnDuration.set(curr.to_value, []);
        columnDuration.get(curr.to_value)!.push(dur);
      }
    }
  }

  const leadAvg =
    leadPerCard.length > 0
      ? parseFloat(
          (leadPerCard.reduce((s, c) => s + c.hours, 0) / leadPerCard.length).toFixed(2)
        )
      : 0;

  const columnBreakdown = [...columnDuration.entries()].map(([column, durs]) => ({
    column,
    average: parseFloat((durs.reduce((s, d) => s + d, 0) / durs.length).toFixed(2)),
  }));

  // ── Throughput: cards moved to Done per day (last 30 days) ──
  const throughputMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo.getTime() + i * 86_400_000);
    throughputMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const tx of txs) {
    if (tx.to_value?.toLowerCase() === "done") {
      const date = tx.created_at.slice(0, 10);
      if (throughputMap.has(date)) {
        throughputMap.set(date, (throughputMap.get(date) ?? 0) + 1);
      }
    }
  }
  const throughputDaily = [...throughputMap.entries()].map(([date, count]) => ({ date, count }));
  const throughputAvg = parseFloat(
    (throughputDaily.reduce((s, d) => s + d.count, 0) / 30).toFixed(2)
  );

  // ── Stall Time: cards whose last move was > 24h ago and NOT to Done ──
  const STALL_THRESHOLD_MS = 24 * 60 * 60 * 1000;
  const stalledCards: { card_id: string; stalledSince: string; hoursStalled: number }[] = [];

  for (const [cardId, cardTxs] of cardTxMap.entries()) {
    const lastTx = cardTxs[cardTxs.length - 1];
    if (lastTx.to_value?.toLowerCase() === "done") continue;
    const lastMoved = new Date(lastTx.created_at).getTime();
    const elapsed = now.getTime() - lastMoved;
    if (elapsed > STALL_THRESHOLD_MS) {
      stalledCards.push({
        card_id: cardId,
        stalledSince: lastTx.created_at,
        hoursStalled: parseFloat((elapsed / 3_600_000).toFixed(1)),
      });
    }
  }

  // ── Cards metadata for CSV export ──
  const cards: CardMetrics[] = cardIds.map((cardId) => {
    const cardTxs = cardTxMap.get(cardId)!;
    const startTx = cardTxs.find(
      (t) =>
        t.to_value?.toLowerCase().includes("progress") ||
        t.to_value?.toLowerCase() === "doing"
    );
    const doneTx = cardTxs.find((t) => t.to_value?.toLowerCase() === "done");
    const cardInfo = cardTitleMap.get(cardId);
    return {
      card_id: cardId,
      title: cardInfo?.title ?? cardId,
      created_at: cardInfo?.created_at ?? cardTxs[0]?.created_at ?? null,
      started_at: startTx?.created_at ?? null,
      completed_at: doneTx?.created_at ?? null,
    };
  });

  const metrics: MetricsResponse = {
    cycleTime: { average: cycleAvg, perCard: cyclePerCard },
    leadTime: { average: leadAvg, perCard: leadPerCard, columnBreakdown },
    throughput: { daily: throughputDaily, average: throughputAvg },
    stallTime: { stalledCards, count: stalledCards.length },
    cards,
  };

  return NextResponse.json(metrics);
}
