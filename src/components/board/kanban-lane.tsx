"use client";

import React, { useState } from 'react';
import { Lane } from '@/lib/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useTheme } from '../providers';

interface KanbanLaneProps {
  lane: Lane;
  children: React.ReactNode;
}

export function KanbanLane({ lane, children }: KanbanLaneProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { density } = useTheme();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className={cn("flex items-center gap-2", density === 'dense' ? 'py-1' : 'py-2')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
            <Icons.chevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
            <div className={cn("w-3 h-3 rounded-full", lane.color)}></div>
            <h2 className="font-semibold text-sm text-foreground">{lane.name}</h2>
          </Button>
        </CollapsibleTrigger>
        <div className="flex-grow border-t border-dashed border-border"></div>
      </div>
      <CollapsibleContent>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
