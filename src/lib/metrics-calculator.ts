import type { Transaction } from "@/app/api/metrics/route";

export type Column = { id: string; name: string };

export function computeMetrics(
  transactions: Transaction[],
  columns: Column[],
  now: Date = new Date()
) {
  const doneColumnId =
    columns.find((c) => c.name.toLowerCase() === "done")?.id ?? null;
  const inProgressColumnId =
    columns.find(
      (c) =>
        c.name.toLowerCase().includes("progress") ||
        c.name.toLowerCase() === "doing"
    )?.id ?? null;

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const txs = [...transactions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const cardTxMap = new Map<string, Transaction[]>();
  for (const tx of txs) {
    if (!cardTxMap.has(tx.card_id)) cardTxMap.set(tx.card_id, []);
    cardTxMap.get(tx.card_id)!.push(tx);
  }

  // ── Cycle Time ──
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
        (new Date(endTx.created_at).getTime() -
          new Date(startTx.created_at).getTime()) /
        3_600_000;
      if (hours >= 0)
        cyclePerCard.push({ card_id: cardId, hours: parseFloat(hours.toFixed(2)) });
    }
  }
  const cycleAvg =
    cyclePerCard.length > 0
      ? parseFloat(
          (
            cyclePerCard.reduce((s, c) => s + c.hours, 0) / cyclePerCard.length
          ).toFixed(2)
        )
      : 0;

  // ── Lead Time ──
  const leadPerCard: { card_id: string; hours: number }[] = [];
  const columnDuration = new Map<string, number[]>();
  for (const [cardId, cardTxs] of cardTxMap.entries()) {
    const firstTx = cardTxs[0];
    const doneTx = doneColumnId
      ? cardTxs.find((t) => t.to_column_id === doneColumnId)
      : null;
    if (firstTx && doneTx) {
      const hours =
        (new Date(doneTx.created_at).getTime() -
          new Date(firstTx.created_at).getTime()) /
        3_600_000;
      if (hours >= 0)
        leadPerCard.push({ card_id: cardId, hours: parseFloat(hours.toFixed(2)) });
    }
    for (let i = 0; i < cardTxs.length - 1; i++) {
      const curr = cardTxs[i];
      const next = cardTxs[i + 1];
      if (curr.to_column_id) {
        const dur =
          (new Date(next.created_at).getTime() -
            new Date(curr.created_at).getTime()) /
          3_600_000;
        if (!columnDuration.has(curr.to_column_id))
          columnDuration.set(curr.to_column_id, []);
        columnDuration.get(curr.to_column_id)!.push(dur);
      }
    }
  }
  const leadAvg =
    leadPerCard.length > 0
      ? parseFloat(
          (
            leadPerCard.reduce((s, c) => s + c.hours, 0) / leadPerCard.length
          ).toFixed(2)
        )
      : 0;

  const columnBreakdown = [...columnDuration.entries()].map(
    ([column_id, durs]) => ({
      column_id,
      average: parseFloat(
        (durs.reduce((s, d) => s + d, 0) / durs.length).toFixed(2)
      ),
    })
  );

  // ── Throughput ──
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
  const throughputDaily = [...throughputMap.entries()].map(([date, count]) => ({
    date,
    count,
  }));
  const throughputAvg = parseFloat(
    (throughputDaily.reduce((s, d) => s + d.count, 0) / 30).toFixed(2)
  );

  // ── Stall Time ──
  const STALL_MS = 24 * 60 * 60 * 1000;
  const stalledCards: {
    card_id: string;
    stalledSince: string;
    hoursStalled: number;
  }[] = [];
  for (const [cardId, cardTxs] of cardTxMap.entries()) {
    const lastTx = cardTxs[cardTxs.length - 1];
    if (doneColumnId && lastTx.to_column_id === doneColumnId) continue;
    const elapsed = now.getTime() - new Date(lastTx.created_at).getTime();
    if (elapsed > STALL_MS) {
      stalledCards.push({
        card_id: cardId,
        stalledSince: lastTx.created_at,
        hoursStalled: parseFloat((elapsed / 3_600_000).toFixed(1)),
      });
    }
  }

  return {
    cycleTime: { average: cycleAvg, perCard: cyclePerCard },
    leadTime: { average: leadAvg, perCard: leadPerCard, columnBreakdown },
    throughput: { daily: throughputDaily, average: throughputAvg },
    stallTime: { stalledCards, count: stalledCards.length },
  };
}
