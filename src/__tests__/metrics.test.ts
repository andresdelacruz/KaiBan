import { computeMetrics } from "../lib/metrics-calculator";
import type { Transaction, MetricsResponse, CardMetrics } from "../app/api/metrics/route";
import { generateMetricsCSV } from "../lib/csv-export";

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

// ─── generateMetricsCSV ──────────────────────────────────────────────────────

function makeMetrics(overrides: Partial<MetricsResponse> = {}): MetricsResponse {
  return {
    cycleTime: { average: 0, perCard: [] },
    leadTime: { average: 0, perCard: [], columnBreakdown: [] },
    throughput: { daily: [], average: 0 },
    stallTime: { stalledCards: [], count: 0 },
    cards: [],
    ...overrides,
  };
}

describe("generateMetricsCSV", () => {
  const cards: CardMetrics[] = [
    {
      card_id: "card-1",
      title: "Fix login bug",
      created_at: "2026-02-01T08:00:00Z",
      started_at: "2026-02-02T09:00:00Z",
      completed_at: "2026-02-03T11:00:00Z",
    },
    {
      card_id: "card-2",
      title: "Add dark mode",
      created_at: "2026-02-10T10:00:00Z",
      started_at: null,
      completed_at: null,
    },
  ];

  it("produces a CSV with header row", () => {
    const csv = generateMetricsCSV(makeMetrics(), []);
    const header = csv.split("\n")[0];
    expect(header).toBe(
      "card_id,title,created_at,started_at,completed_at,cycle_time_hours,lead_time_hours,stall_time_hours"
    );
  });

  it("generates one data row per card", () => {
    const csv = generateMetricsCSV(makeMetrics({ cards }), cards);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // header + 2 rows
  });

  it("fills cycle_time_hours from metrics.cycleTime.perCard", () => {
    const metrics = makeMetrics({
      cycleTime: { average: 2, perCard: [{ card_id: "card-1", hours: 2 }] },
      cards,
    });
    const csv = generateMetricsCSV(metrics, cards);
    const row1 = csv.split("\n")[1];
    expect(row1).toContain("2"); // cycle_time_hours = 2
  });

  it("leaves cycle/lead/stall blank when card has no data", () => {
    const csv = generateMetricsCSV(makeMetrics({ cards }), cards);
    const row2 = csv.split("\n")[2]; // card-2 has no metrics
    // last 3 columns should be empty
    const parts = row2.split(",");
    expect(parts[parts.length - 1]).toBe(""); // stall_time_hours
    expect(parts[parts.length - 2]).toBe(""); // lead_time_hours
    expect(parts[parts.length - 3]).toBe(""); // cycle_time_hours
  });

  it("escapes titles that contain commas", () => {
    const commaCard: CardMetrics[] = [
      {
        card_id: "card-3",
        title: "Fix bug, urgent",
        created_at: null,
        started_at: null,
        completed_at: null,
      },
    ];
    const csv = generateMetricsCSV(makeMetrics(), commaCard);
    expect(csv).toContain('"Fix bug, urgent"');
  });
});

// ─── Date range filter (unit-level simulation) ────────────────────────────────

describe("date range filtering logic", () => {
  /**
   * Simulate what the API does: filter transactions by from/to date
   * before computing metrics.
   */
  function filterTxsByRange(
    txs: Transaction[],
    from: string | null,
    to: string | null
  ): Transaction[] {
    return txs.filter((t) => {
      const d = new Date(t.created_at).getTime();
      if (from && d < new Date(from).getTime()) return false;
      if (to && d > new Date(`${to}T23:59:59.999Z`).getTime()) return false;
      return true;
    });
  }

  const allTxs: Transaction[] = [
    {
      id: "1",
      card_id: "card-1",
      board_id: BOARD_ID,
      from_column_id: null,
      to_column_id: COL_INPROGRESS,
      created_at: "2026-01-10T08:00:00Z",
      user_id: null,
    },
    {
      id: "2",
      card_id: "card-1",
      board_id: BOARD_ID,
      from_column_id: COL_INPROGRESS,
      to_column_id: COL_DONE,
      created_at: "2026-01-10T10:00:00Z",
      user_id: null,
    },
    {
      id: "3",
      card_id: "card-2",
      board_id: BOARD_ID,
      from_column_id: null,
      to_column_id: COL_INPROGRESS,
      created_at: "2026-02-15T08:00:00Z",
      user_id: null,
    },
  ];

  it("returns all transactions when no range is set", () => {
    expect(filterTxsByRange(allTxs, null, null)).toHaveLength(3);
  });

  it("filters out transactions before 'from' date", () => {
    const result = filterTxsByRange(allTxs, "2026-02-01", null);
    expect(result).toHaveLength(1);
    expect(result[0].card_id).toBe("card-2");
  });

  it("filters out transactions after 'to' date", () => {
    const result = filterTxsByRange(allTxs, null, "2026-01-31");
    expect(result).toHaveLength(2);
    result.forEach((t) => expect(t.card_id).toBe("card-1"));
  });

  it("applies both from and to constraints", () => {
    const result = filterTxsByRange(allTxs, "2026-01-10", "2026-01-10");
    expect(result).toHaveLength(2);
  });

  it("returns empty array when range excludes all transactions", () => {
    const result = filterTxsByRange(allTxs, "2027-01-01", null);
    expect(result).toHaveLength(0);
  });
});
