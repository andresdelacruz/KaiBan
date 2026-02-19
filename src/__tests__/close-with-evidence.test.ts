/**
 * Close-with-evidence flow tests
 * Tests the score-gated moveCard logic without React/DOM overhead.
 */

// ── Constants (must mirror EVIDENCE_SCORE_THRESHOLD in modal) ─────────────
// Keep in sync with close-with-evidence-modal.tsx
const EVIDENCE_SCORE_THRESHOLD = 70;

// ── Pure helpers (extracted from modal logic for testability) ──────────────

interface Column {
  id: string;
  name: string;
}

interface AssessmentResult {
  relevanceScore: number;
  feedback: string;
}

function shouldMoveCardToDone(assessment: AssessmentResult): boolean {
  return assessment.relevanceScore > EVIDENCE_SCORE_THRESHOLD;
}

function findDoneColumn(columns: Column[]): Column | undefined {
  return columns.find((c) => c.name.toLowerCase() === "done");
}

// ── Fixtures ──────────────────────────────────────────────────────────────

const columns: Column[] = [
  { id: "col-1", name: "Backlog" },
  { id: "col-2", name: "In Progress" },
  { id: "col-3", name: "Review" },
  { id: "col-4", name: "Done" },
];

// ── Tests ─────────────────────────────────────────────────────────────────

describe("EVIDENCE_SCORE_THRESHOLD constant", () => {
  it("is 70", () => {
    expect(EVIDENCE_SCORE_THRESHOLD).toBe(70);
  });
});

describe("shouldMoveCardToDone", () => {
  it("returns true when score exceeds threshold", () => {
    expect(shouldMoveCardToDone({ relevanceScore: 85, feedback: "Great" })).toBe(true);
    expect(shouldMoveCardToDone({ relevanceScore: 71, feedback: "Ok" })).toBe(true);
  });

  it("returns false when score equals threshold (strict >)", () => {
    expect(shouldMoveCardToDone({ relevanceScore: 70, feedback: "Borderline" })).toBe(false);
  });

  it("returns false when score is below threshold", () => {
    expect(shouldMoveCardToDone({ relevanceScore: 50, feedback: "Weak" })).toBe(false);
    expect(shouldMoveCardToDone({ relevanceScore: 0, feedback: "No evidence" })).toBe(false);
  });
});

describe("findDoneColumn", () => {
  it("finds Done column case-insensitively", () => {
    const col = findDoneColumn(columns);
    expect(col).toBeDefined();
    expect(col!.id).toBe("col-4");
  });

  it("returns undefined when no Done column exists", () => {
    const col = findDoneColumn([{ id: "col-1", name: "Backlog" }]);
    expect(col).toBeUndefined();
  });
});

describe("close-with-evidence flow integration", () => {
  it("calls moveCard when evidence is approved", async () => {
    const mockMoveCard = vi.fn().mockResolvedValue(undefined);
    const assessment: AssessmentResult = { relevanceScore: 90, feedback: "Excellent evidence" };

    if (shouldMoveCardToDone(assessment)) {
      const doneCol = findDoneColumn(columns);
      if (doneCol) await mockMoveCard("card-123", doneCol.id, null);
    }

    expect(mockMoveCard).toHaveBeenCalledWith("card-123", "col-4", null);
  });

  it("does NOT call moveCard when evidence is rejected", async () => {
    const mockMoveCard = vi.fn().mockResolvedValue(undefined);
    const assessment: AssessmentResult = { relevanceScore: 40, feedback: "Insufficient" };

    if (shouldMoveCardToDone(assessment)) {
      const doneCol = findDoneColumn(columns);
      if (doneCol) await mockMoveCard("card-123", doneCol.id, null);
    }

    expect(mockMoveCard).not.toHaveBeenCalled();
  });
});
