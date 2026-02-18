"use client";

import { KanbanBoard } from "@/components/board/kanban-board";
import { boards, columns, cards, lanes, users } from "@/lib/mock-data";

export default function Home() {
  const currentBoard = boards[0];

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <KanbanBoard
        board={currentBoard}
        columns={columns.filter((c) => c.board_id === currentBoard.id)}
        cards={cards.filter((c) =>
          columns.some(
            (col) => col.id === c.column_id && col.board_id === currentBoard.id
          )
        )}
        lanes={lanes.filter((l) => l.board_id === currentBoard.id)}
        users={users}
      />
    </main>
  );
}
