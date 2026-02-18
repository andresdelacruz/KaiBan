"use client";
import React, { useState, useEffect } from "react";
import { KanbanLane } from "./kanban-lane";
import { KanbanColumn } from "./kanban-column";
import { Card, Column, Lane, User, Board } from "@/lib/types";
import { useTheme } from "@/components/providers";
import { useBoardContext } from "@/lib/board-context";

type KanbanBoardProps = {
  board: Board;
  columns: Column[];
  cards: Card[];
  lanes: Lane[];
  users: User[];
};

export function KanbanBoard({
  board,
  columns: initialColumns,
  cards,
  lanes: initialLanes,
  users,
}: KanbanBoardProps) {
  const { density } = useTheme();
  const { moveCard } = useBoardContext();
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const onCardDrop = (cardId: string, newColumnId: string, newLaneId: string | null) => {
    moveCard(cardId, newColumnId, newLaneId);
  };

  const sortedLanes = [...initialLanes, { id: "unassigned", name: "Unassigned", color: "bg-muted/20", board_id: board.id, order: initialLanes.length + 1 }].sort((a, b) => a.order - b.order);
  const sortedColumns = [...initialColumns].sort((a, b) => a.order - b.order);

  if (!isClient) {
    return <div className="flex-1 p-6 bg-muted/20 animate-pulse" />;
  }

  if (sortedColumns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">No columns yet. Add columns in Settings.</p>
      </div>
    );
  }

  return (
    <div className={cn("flex-1 flex flex-col gap-4 overflow-auto p-4 md:p-6", density === 'dense' ? 'gap-2 p-2 md:p-3' : '')}>
      {sortedLanes.map((lane) => (
        <KanbanLane key={lane.id} lane={lane}>
          <div className="flex gap-4">
            {sortedColumns.map((column) => {
              const columnCards = cards.filter(
                (card) =>
                  card.column_id === column.id &&
                  (card.lane_id === lane.id || (lane.id === "unassigned" && !card.lane_id))
              );
              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  cards={columnCards}
                  users={users}
                  onCardDrop={onCardDrop}
                  laneId={lane.id}
                />
              );
            })}
          </div>
        </KanbanLane>
      ))}
    </div>
  );
}

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
