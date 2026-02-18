"use client";

import React, { useState } from 'react';
import { KanbanCard } from './kanban-card';
import { Card, Column, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { useBoardContext } from '@/lib/board-context';

interface KanbanColumnProps {
  column: Column;
  cards: Card[];
  users: User[];
  onCardDrop: (cardId: string, newColumnId: string, newLaneId: string | null) => void;
  laneId: string | null;
}

export function KanbanColumn({ column, cards, users, onCardDrop, laneId }: KanbanColumnProps) {
  const [isOver, setIsOver] = React.useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const { addCard } = useBoardContext();

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

  const handleAddCard = async () => {
    if (!newTitle.trim()) return;
    await addCard(column.id, newTitle.trim());
    setNewTitle("");
    setAdding(false);
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
        <div className="flex items-center gap-1">
          {wipLimit !== null && (
            <Badge
              variant={overWipLimit ? 'destructive' : 'secondary'}
              className={cn(atWipLimit && 'bg-amber-500/80 text-white')}
            >
              {wipLimit}
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAdding(true)}>
            <Icons.plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-2 min-h-[100px]">
        {cards.map((card) => (
          <KanbanCard key={card.id} card={card} users={users} />
        ))}
        {adding && (
          <div className="flex flex-col gap-2 p-2 border rounded-lg bg-card">
            <Input
              autoFocus
              placeholder="Card title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCard();
                if (e.key === "Escape") { setAdding(false); setNewTitle(""); }
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCard} disabled={!newTitle.trim()}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewTitle(""); }}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
