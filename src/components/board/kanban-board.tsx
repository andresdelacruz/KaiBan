"use client";
import React, { useState, useEffect } from "react";
import { KanbanLane } from "./kanban-lane";
import { KanbanColumn } from "./kanban-column";
import { Card, Column, Lane, User, Board } from "@/lib/types";
import { useTheme } from "@/components/providers";

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
  cards: initialCards,
  lanes: initialLanes,
  users,
}: KanbanBoardProps) {
  const [cards, setCards] = useState(initialCards);
  const { density } = useTheme();
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);


  const onCardDrop = (cardId: string, newColumnId: string, newLaneId: string | null) => {
    // In a real app, this would trigger an API call.
    // For now, we update the local state.
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === cardId ? { ...card, column_id: newColumnId, lane_id: newLaneId } : card
      )
    );
    console.log(`Moved card ${cardId} to column ${newColumnId} in lane ${newLaneId}`);
  };

  const sortedLanes = [...initialLanes, { id: "unassigned", name: "Unassigned", color: "bg-muted/20", board_id: board.id, order: initialLanes.length + 1 }].sort((a, b) => a.order - b.order);
  const sortedColumns = initialColumns.sort((a, b) => a.order - b.order);

  // Render a skeleton or loading state on the server
  if (!isClient) {
    return <div className="flex-1 p-6 bg-muted/20 animate-pulse" />;
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

// cn utility needs to be defined if not globally available
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
