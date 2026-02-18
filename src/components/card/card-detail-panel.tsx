"use client";

import { Card, User, ChecklistItem, Comment as CommentType } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { CloseWithEvidenceModal } from "./close-with-evidence-modal";
import { Separator } from "../ui/separator";
import { format } from "date-fns";
import React, { useState } from "react";
import { ScrollArea } from "../ui/scroll-area";

interface CardDetailPanelProps {
  card: Card;
  users: User[];
  children: React.ReactNode;
}

export function CardDetailPanel({ card, users, children }: CardDetailPanelProps) {
  const owner = users.find((u) => u.id === card.owner_id);
  const [checklist, setChecklist] = useState(card.checklist);

  const toggleChecklistItem = (itemId: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-[500px] sm:max-w-none flex flex-col p-0">
        <ScrollArea className="flex-1">
        <div className="p-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl">{card.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-muted-foreground font-medium">Assignee</label>
              <div className="flex items-center gap-2 mt-1">
                {owner ? (
                  <>
                    <UserAvatar user={owner} className="h-6 w-6" />
                    <span>{owner.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-muted-foreground font-medium">Priority</label>
              <div className="mt-1">
                <PriorityBadge priority={card.priority} textVisible />
              </div>
            </div>
          </div>
          
          <div>
            <label className="text-muted-foreground font-medium">Description</label>
            <Textarea defaultValue={card.description} className="mt-1 h-32" />
          </div>

          {checklist.length > 0 && (
            <div>
              <label className="text-muted-foreground font-medium">Checklist</label>
              <Progress value={progress} className="my-2 h-1" />
              <div className="space-y-2 mt-2">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <Checkbox
                      id={item.id}
                      checked={item.completed}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                    />
                    <label htmlFor={item.id} className="text-sm flex-1 cursor-pointer">{item.text}</label>
                     <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100">
                      <Icons.trash className="h-3 w-3"/>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
             <label className="text-muted-foreground font-medium mb-2 block">Comments</label>
            <div className="space-y-4">
              {card.comments.map(comment => {
                  const author = users.find(u => u.id === comment.author_id);
                  return (
                     <div key={comment.id} className="flex items-start gap-3">
                        <UserAvatar user={author} className="h-8 w-8 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">{author?.name}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(comment.created_at), "MMM d")}</span>
                          </div>
                          <div className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-2 mt-1">
                            {comment.text}
                          </div>
                        </div>
                     </div>
                  );
              })}
              <div className="flex items-start gap-3">
                <UserAvatar user={users[0]} className="h-8 w-8 mt-1"/>
                <div className="flex-1">
                  <Input placeholder="Add a comment..."/>
                </div>
              </div>
            </div>
          </div>

        </div>
        </div>
        </ScrollArea>
        <div className="p-6 border-t bg-background mt-auto">
            <CloseWithEvidenceModal card={card}>
                <Button className="w-full" variant="secondary">
                <Icons.archive className="mr-2 h-4 w-4" />
                Close with Evidence
                </Button>
            </CloseWithEvidenceModal>
        </div>
      </SheetContent>
    </Sheet>
  );
}
