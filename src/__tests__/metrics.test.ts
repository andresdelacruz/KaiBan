import { computeMetrics } from "../lib/metrics-calculator";
import type { Transaction } from "../app/api/metrics/route";

const BOARD_ID = "board-1";
const COL_BACKLOG = "col-backlog";
const COL_INPROGRESS = "col-inprogress";
const COL_DONE = "col-done";

const columns = [
  { id: COL_BACKLOG, name: "Backlog" },
  { id: COL_INPROGRESS, name: "In Progress" },
  { id: COL_DONE, name: "Done" },
];

function tx(
  card_id: string,
  from_column_id: string | null,
  to_column_id: string,
  created_at: string
): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    card_id,
    board_id: BOARD_ID,
    from_column_id,
    to_column_id,
    created_at,
    user_id: null,
  };
}

describe("computeMetrics", () => {
  const now = new Date("2026-02-19T12:00:00Z");

  describe("cycleTime", () => {
    it("returns 0 average when no cards are done", () => {
      const txs = [tx("card-1", null, COL_INPROGRESS, "2026-02-19T10:00:00Z")];
      const m = computeMetrics(txs, columns, now);
      expect(m.cycleTime.average).toBe(0);
      expect(m.cycleTime.perCard).toHaveLength(0);
    });

    it("calculates cycle time from InProgress to Done", () => {
      const txs = [
        tx("card-1", null, COL_BACKLOG, "2026-02-19T08:00:00Z"),
        tx("card-1", COL_BACKLOG, COL_INPROGRESS, "2026-02-19T09:00:00Z"),
        tx("card-1", COL_INPROGRESS, COL_DONE, "2026-02-19T11:00:00Z"),
      ];
      const m = computeMetrics(txs, columns, now);
      // From InProgress (09:00) to Done (11:00) = 2h
      expect(m.cycleTime.perCard[0].hours).toBe(2);
      expect(m.cycleTime.average).toBe(2);
    });

    it("averages cycle time across multiple cards", () => {
      const txs = [
        tx("card-1", null, COL_INPROGRESS, "2026-02-19T08:00:00Z"),
        tx("card-1", COL_INPROGRESS, COL_DONE, "2026-02-19T10:00:00Z"), // 2h
        tx("card-2", null, COL_INPROGRESS, "2026-02-19T06:00:00Z"),
        tx("card-2", COL_INPROGRESS, COL_DONE, "2026-02-19T10:00:00Z"), // 4h
      ];
      const m = computeMetrics(txs, columns, now);
      expect(m.cycleTime.average).toBe(3); // (2+4)/2
    });
  });

  describe("leadTime", () => {
    it("calculates lead time from first tx to Done", () => {
      const txs = [
        tx("card-1", null, COL_BACKLOG, "2026-02-19T06:00:00Z"),
        tx("card-1", COL_BACKLOG, COL_INPROGRESS, "2026-02-19T08:00:00Z"),
        tx("card-1", COL_INPROGRESS, COL_DONE, "2026-02-19T10:00:00Z"),
      ];
      const m = computeMetrics(txs, columns, now);
      // From 06:00 to 10:00 = 4h
      expect(m.leadTime.perCard[0].hours).toBe(4);
      expect(m.leadTime.average).toBe(4);
    });

    it("computes column breakdown", () => {
      const txs = [
        tx("card-1", null, COL_BACKLOG, "2026-02-19T06:00:00Z"),
        tx("card-1", COL_BACKLOG, COL_INPROGRESS, "2026-02-19T08:00:00Z"), // 2h in backlog
        tx("card-1", COL_INPROGRESS, COL_DONE, "2026-02-19T10:00:00Z"),   // 2h in progress
      ];
      const m = computeMetrics(txs, columns, now);
      const backlogEntry = m.leadTime.columnBreakdown.find(
        (c) => c.column_id === COL_BACKLOG
      );
      const progressEntry = m.leadTime.columnBreakdown.find(
        (c) => c.column_id === COL_INPROGRESS
      );
      expect(backlogEntry?.average).toBe(2);
      expect(progressEntry?.average).toBe(2);
    });
  });

  describe("throughput", () => {
    it("returns 30 daily entries", () => {
      const m = computeMetrics([], columns, now);
      expect(m.throughput.daily).toHaveLength(30);
    });

    it("counts cards moved to Done per day", () => {
      const yesterday = "2026-02-18";
      const txs = [
        tx("card-1", COL_INPROGRESS, COL_DONE, `${yesterday}T10:00:00Z`),
        tx("card-2", COL_INPROGRESS, COL_DONE, `${yesterday}T14:00:00Z`),
      ];
      const m = computeMetrics(txs, columns, now);
      const entry = m.throughput.daily.find((d) => d.date === yesterday);
      expect(entry?.count).toBe(2);
    });

    it("has 0 average when no cards done", () => {
      const m = computeMetrics([], columns, now);
      expect(m.throughput.average).toBe(0);
    });
  });

  describe("stallTime", () => {
    it("detects no stalls when cards were recently moved", () => {
      const txs = [
        tx("card-1", COL_BACKLOG, COL_INPROGRESS, "2026-02-19T11:00:00Z"),
      ];
      const m = computeMetrics(txs, columns, now);
      expect(m.stallTime.count).toBe(0);
    });

    it("detects stalled card after 24h without movement", () => {
      const txs = [
        // Last move was 30h ago
        tx("card-1", COL_BACKLOG, COL_INPROGRESS, "2026-02-18T06:00:00Z"),
      ];
      const m = computeMetrics(txs, columns, now);
      expect(m.stallTime.count).toBe(1);
      expect(m.stallTime.stalledCards[0].card_id).toBe("card-1");
      expect(m.stallTime.stalledCards[0].hoursStalled).toBeGreaterThan(24);
    });

    it("does not count Done cards as stalled", () => {
      const txs = [
        tx("card-1", COL_BACKLOG, COL_DONE, "2026-01-01T00:00:00Z"),
      ];
      const m = computeMetrics(txs, columns, now);
      expect(m.stallTime.count).toBe(0);
    });

    it("counts multiple stalled cards", () => {
      const txs = [
        tx("card-1", COL_BACKLOG, COL_INPROGRESS, "2026-02-17T00:00:00Z"),
        tx("card-2", COL_BACKLOG, COL_INPROGRESS, "2026-02-16T00:00:00Z"),
        tx("card-3", COL_BACKLOG, COL_INPROGRESS, "2026-02-19T11:30:00Z"), // not stalled
      ];
      const m = computeMetrics(txs, columns, now);
      expect(m.stallTime.count).toBe(2);
    });
  });
});
