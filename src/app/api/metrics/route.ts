import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type Transaction = {
  id: string;
  card_id: string;
  board_id: string;
  from_column_id: string | null;
  to_column_id: string | null;
  created_at: string;
  user_id: string | null;
};

export type MetricsResponse = {
  cycleTime: {
    average: number; // hours
    perCard: { card_id: string; hours: number }[];
  };
  leadTime: {
    average: number; // hours
    perCard: { card_id: string; hours: number }[];
    columnBreakdown: { column_id: string; average: number }[];
  };
  throughput: {
    daily: { date: string; count: number }[];
    average: number; // cards/day over 30 days
  };
  stallTime: {
    stalledCards: { card_id: string; stalledSince: string; hoursStalled: number }[];
    count: number;
  };
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId");

  if (!boardId) {
    return NextResponse.json({ error: "boardId is required" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch transactions for the board
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("board_id", boardId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const txs: Transaction[] = transactions ?? [];

  // Fetch columns to identify "Done" column
  const { data: columns } = await supabase
    .from("columns")
    .select("id, name")
    .eq("board_id", boardId);

  const doneColumnId = columns?.find(
    (c) => c.name.toLowerCase() === "done"
  )?.id ?? null;

  // ── Cycle Time: from first move (start of work, e.g. InProgress) to Done ──
  // We consider "In Progress" or similar as the start column
  const inProgressColumnId = columns?.find(
    (c) => c.name.toLowerCase().includes("progress") || c.name.toLowerCase() === "doing"
  )?.id ?? null;

  const cardTxMap = new Map<string, Transaction[]>();
  for (const tx of txs) {
    if (!cardTxMap.has(tx.card_id)) cardTxMap.set(tx.card_id, []);
    cardTxMap.get(tx.card_id)!.push(tx);
  }

  // Cycle Time: from entry into InProgress to Done
  const cyclePerCard: { card_id: string; hours: number }[] = [];
  for (const [cardId, cardTxs] of cardTxMap.entries()) {
    const startTx = inProgressColumnId
      ? cardTxs.find((t) => t.to_column_id === inProgressColumnId)
      : cardTxs[0];
    const endTx = doneColumnId
      ? cardTxs.find((t) => t.to_column_id === doneColumnId)
      : null;
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

  // Lead Time: from first transaction (creation / backlog entry) to Done
  const leadPerCard: { card_id: string; hours: number }[] = [];
  const columnDuration = new Map<string, number[]>();
  for (const [cardId, cardTxs] of cardTxMap.entries()) {
    const firstTx = cardTxs[0];
    const doneTx = doneColumnId
      ? cardTxs.find((t) => t.to_column_id === doneColumnId)
      : null;
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
      if (curr.to_column_id) {
        const dur =
          (new Date(next.created_at).getTime() - new Date(curr.created_at).getTime()) /
          3_600_000;
        if (!columnDuration.has(curr.to_column_id)) columnDuration.set(curr.to_column_id, []);
        columnDuration.get(curr.to_column_id)!.push(dur);
      }
    }
  }
  const leadAvg =
    leadPerCard.length > 0
      ? parseFloat(
          (leadPerCard.reduce((s, c) => s + c.hours, 0) / leadPerCard.length).toFixed(2)
        )
      : 0;

  const columnBreakdown = [...columnDuration.entries()].map(([column_id, durs]) => ({
    column_id,
    average: parseFloat((durs.reduce((s, d) => s + d, 0) / durs.length).toFixed(2)),
  }));

  // ── Throughput: cards that moved to Done per day (last 30 days) ──
  const throughputMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo.getTime() + i * 86_400_000);
    throughputMap.set(d.toISOString().slice(0, 10), 0);
  }
  if (doneColumnId) {
    for (const tx of txs) {
      if (tx.to_column_id === doneColumnId) {
        const date = tx.created_at.slice(0, 10);
        if (throughputMap.has(date)) {
          throughputMap.set(date, (throughputMap.get(date) ?? 0) + 1);
        }
      }
    }
  }
  const throughputDaily = [...throughputMap.entries()].map(([date, count]) => ({ date, count }));
  const throughputAvg = parseFloat(
    (throughputDaily.reduce((s, d) => s + d.count, 0) / 30).toFixed(2)
  );

  // ── Stall Time: cards with last transaction > 24h ago (still active) ──
  const STALL_THRESHOLD_MS = 24 * 60 * 60 * 1000;
  const stalledCards: { card_id: string; stalledSince: string; hoursStalled: number }[] = [];

  for (const [cardId, cardTxs] of cardTxMap.entries()) {
    const lastTx = cardTxs[cardTxs.length - 1];
    // Skip cards that already reached Done
    if (doneColumnId && lastTx.to_column_id === doneColumnId) continue;
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

  const metrics: MetricsResponse = {
    cycleTime: { average: cycleAvg, perCard: cyclePerCard },
    leadTime: { average: leadAvg, perCard: leadPerCard, columnBreakdown },
    throughput: { daily: throughputDaily, average: throughputAvg },
    stallTime: { stalledCards, count: stalledCards.length },
  };

  return NextResponse.json(metrics);
}
