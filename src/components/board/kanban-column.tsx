"use client";

import React from 'react';
import { KanbanCard } from './kanban-card';
import { Card, Column, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface KanbanColumnProps {
  column: Column;
  cards: Card[];
  users: User[];
  onCardDrop: (cardId: string, newColumnId: string, newLaneId: string | null) => void;
  laneId: string | null;
}

export function KanbanColumn({ column, cards, users, onCardDrop, laneId }: KanbanColumnProps) {
  const [isOver, setIsOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const cardId = e.dataTransfer.getData('cardId');
    if (cardId) {
      onCardDrop(cardId, column.id, laneId);
    }
  };

  const wipLimit = column.wip_limit;
  const cardCount = cards.length;
  const atWipLimit = wipLimit !== null && cardCount === wipLimit;
  const overWipLimit = wipLimit !== null && cardCount > wipLimit;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "w-72 flex-shrink-0 rounded-lg",
        isOver && "bg-secondary"
      )}
    >
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{column.name}</h3>
          <span className="text-sm text-muted-foreground">{cardCount}</span>
        </div>
        {wipLimit !== null && (
          <Badge
            variant={overWipLimit ? 'destructive' : 'secondary'}
            className={cn(atWipLimit && 'bg-amber-500/80 text-white')}
          >
            {wipLimit}
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-2 p-2 min-h-[100px]">
        {cards.map((card) => (
          <KanbanCard key={card.id} card={card} users={users} />
        ))}
      </div>
    </div>
  );
}
