"use client";

import { KanbanBoard } from "@/components/board/kanban-board";
import { useBoardContext } from "@/lib/board-context";
import { EmptyBoardState } from "@/components/board/empty-board-state";

export default function Home() {
  const { currentBoard, columns, cards, lanes, users, loading } = useBoardContext();

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  if (!currentBoard) {
    return <EmptyBoardState />;
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <KanbanBoard
        board={currentBoard}
        columns={columns}
        cards={cards}
        lanes={lanes}
        users={users}
      />
    </main>
  );
}
