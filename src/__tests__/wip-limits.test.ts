/**
 * WIP Limits enforcement tests
 * Tests the blocking logic for drag-and-drop and badge state in KanbanColumn
 */

interface Column {
  id: string;
  name: string;
  board_id: string;
  wip_limit: number | null;
  order: number;
}

// Pure logic extracted from KanbanColumn for testability
function computeWipState(column: Column, cardCount: number) {
  const wipLimit = column.wip_limit;
  const atWipLimit = wipLimit !== null && cardCount === wipLimit;
  const overWipLimit = wipLimit !== null && cardCount > wipLimit;
  const isWipBlocked = wipLimit !== null && cardCount >= wipLimit;
  return { wipLimit, atWipLimit, overWipLimit, isWipBlocked };
}

function makeBadgeLabel(cardCount: number, wipLimit: number | null): string | null {
  if (wipLimit === null) return null;
  return `${cardCount}/${wipLimit}`;
}

function badgeVariant(overWipLimit: boolean): "destructive" | "secondary" {
  return overWipLimit ? "destructive" : "secondary";
}

const baseColumn: Column = {
  id: "col-1",
  name: "In Progress",
  board_id: "board-1",
  wip_limit: null,
  order: 1,
};

// --- Tests ---

describe("WIP Limits: isWipBlocked", () => {
  test("not blocked when column has no WIP limit", () => {
    const { isWipBlocked } = computeWipState({ ...baseColumn, wip_limit: null }, 10);
    expect(isWipBlocked).toBe(false);
  });

  test("not blocked when cardCount < wipLimit", () => {
    const { isWipBlocked } = computeWipState({ ...baseColumn, wip_limit: 3 }, 2);
    expect(isWipBlocked).toBe(false);
  });

  test("blocked when cardCount === wipLimit (at limit)", () => {
    const { isWipBlocked } = computeWipState({ ...baseColumn, wip_limit: 3 }, 3);
    expect(isWipBlocked).toBe(true);
  });

  test("blocked when cardCount > wipLimit (over limit)", () => {
    const { isWipBlocked } = computeWipState({ ...baseColumn, wip_limit: 3 }, 5);
    expect(isWipBlocked).toBe(true);
  });
});

describe("WIP Limits: badge state", () => {
  test("badge shows X/N format", () => {
    expect(makeBadgeLabel(2, 3)).toBe("2/3");
  });

  test("no badge when no WIP limit", () => {
    expect(makeBadgeLabel(5, null)).toBeNull();
  });

  test("badge variant is amber (secondary) when at limit", () => {
    const { atWipLimit, overWipLimit } = computeWipState({ ...baseColumn, wip_limit: 3 }, 3);
    expect(atWipLimit).toBe(true);
    expect(overWipLimit).toBe(false);
    // secondary variant with amber class override when atWipLimit
    expect(badgeVariant(overWipLimit)).toBe("secondary");
  });

  test("badge variant is destructive (red) when over limit", () => {
    const { overWipLimit } = computeWipState({ ...baseColumn, wip_limit: 3 }, 4);
    expect(badgeVariant(overWipLimit)).toBe("destructive");
  });
});
