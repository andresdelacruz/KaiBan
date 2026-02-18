"use client";

import React from 'react';
import { Card as CardType, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/shared/user-avatar';
import { PriorityBadge } from '@/components/shared/priority-badge';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers';
import { CardDetailPanel } from '@/components/card/card-detail-panel';

interface KanbanCardProps {
  card: CardType;
  users: User[];
}

export function KanbanCard({ card, users }: KanbanCardProps) {
  const { density } = useTheme();
  const owner = users.find((u) => u.id === card.owner_id);
  const checklistItems = card.checklist;
  const completedItems = checklistItems.filter((item) => item.completed).length;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('cardId', card.id);
  };

  const isDense = density === 'dense';

  return (
    <CardDetailPanel card={card} users={users}>
      <Card
        draggable
        onDragStart={handleDragStart}
        className={cn(
          'kanban-card cursor-pointer hover:bg-secondary/50 transition-colors',
          isDense ? 'p-2' : 'p-3'
        )}
      >
        <CardHeader className={cn('p-0', isDense ? 'mb-2' : 'mb-3')}>
          <CardTitle className={cn('text-sm font-medium', isDense ? 'text-xs' : 'text-sm')}>{card.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={card.priority} />
            {checklistItems.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icons.checklist className="h-3 w-3" />
                {completedItems}/{checklistItems.length}
              </span>
            )}
            {card.comments.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icons.comments className="h-3 w-3" />
                {card.comments.length}
              </span>
            )}
          </div>
          {owner && <UserAvatar user={owner} className={cn(isDense ? 'h-5 w-5' : 'h-6 w-6')} />}
        </CardContent>
      </Card>
    </CardDetailPanel>
  );
}
