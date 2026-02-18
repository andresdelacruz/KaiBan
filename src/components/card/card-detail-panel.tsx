"use client";

import { Card as CardType, User, ChecklistItem, Priority } from "@/lib/types";
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
import { Separator } from "../ui/separator";
import { format } from "date-fns";
import React, { useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as api from "@/lib/api";
import { useBoardContext } from "@/lib/board-context";

interface CardDetailPanelProps {
  card: CardType;
  users: User[];
  children: React.ReactNode;
}

export function CardDetailPanel({ card, users, children }: CardDetailPanelProps) {
  const { currentUser, refreshBoard } = useBoardContext();
  const owner = users.find((u) => u.id === card.owner_id);
  const [checklist, setChecklist] = useState(card.checklist);
  const [description, setDescription] = useState(card.description);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(card.comments);
  const [priority, setPriority] = useState<Priority>(card.priority);
  const [ownerId, setOwnerId] = useState(card.owner_id ?? "");

  const toggleChecklistItem = async (itemId: string) => {
    const item = checklist.find((i) => i.id === itemId);
    if (!item) return;
    const updated = !item.completed;
    setChecklist(checklist.map((i) => i.id === itemId ? { ...i, completed: updated } : i));
    await api.updateChecklistItem(itemId, { completed: updated });
  };

  const addCheckItem = async () => {
    if (!newCheckItem.trim()) return;
    const item = await api.addChecklistItem(card.id, newCheckItem.trim(), checklist.length);
    setChecklist([...checklist, item]);
    setNewCheckItem("");
  };

  const deleteCheckItem = async (id: string) => {
    await api.deleteChecklistItem(id);
    setChecklist(checklist.filter((i) => i.id !== id));
  };

  const saveDescription = async () => {
    await api.updateCard(card.id, { description });
  };

  const savePriority = async (p: Priority) => {
    setPriority(p);
    await api.updateCard(card.id, { priority: p });
  };

  const saveOwner = async (uid: string) => {
    setOwnerId(uid);
    await api.updateCard(card.id, { owner_id: uid || null });
  };

  const addComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    const comment = await api.addComment(card.id, currentUser.id, newComment.trim());
    setComments([...comments, comment]);
    setNewComment("");
  };

  const deleteCardHandler = async () => {
    await api.deleteCard(card.id);
    refreshBoard();
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
              <Select value={ownerId} onValueChange={saveOwner}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-muted-foreground font-medium">Priority</label>
              <Select value={priority} onValueChange={(v) => savePriority(v as Priority)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["P0", "P1", "P2", "P3"] as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-muted-foreground font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDescription}
              className="mt-1 h-32"
            />
          </div>

          <div>
            <label className="text-muted-foreground font-medium">Checklist</label>
            {checklist.length > 0 && <Progress value={progress} className="my-2 h-1" />}
            <div className="space-y-2 mt-2">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <Checkbox
                    id={item.id}
                    checked={item.completed}
                    onCheckedChange={() => toggleChecklistItem(item.id)}
                  />
                  <label htmlFor={item.id} className="text-sm flex-1 cursor-pointer">{item.text}</label>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-50 hover:opacity-100" onClick={() => deleteCheckItem(item.id)}>
                    <Icons.trash className="h-3 w-3"/>
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add checklist item..."
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCheckItem()}
                />
                <Button size="sm" variant="secondary" onClick={addCheckItem} disabled={!newCheckItem.trim()}>Add</Button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-muted-foreground font-medium mb-2 block">Comments</label>
            <div className="space-y-4">
              {comments.map(comment => {
                const author = users.find(u => u.id === comment.author_id);
                return (
                  <div key={comment.id} className="flex items-start gap-3">
                    <UserAvatar user={author} className="h-8 w-8 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{author?.name ?? "Unknown"}</span>
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
                <UserAvatar user={currentUser ? { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl } : undefined} className="h-8 w-8 mt-1"/>
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addComment()}
                  />
                  <Button size="sm" onClick={addComment} disabled={!newComment.trim()}>Send</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
        </ScrollArea>
        <div className="p-6 border-t bg-background mt-auto flex gap-2">
          <Button variant="destructive" size="sm" onClick={deleteCardHandler}>
            <Icons.trash className="mr-2 h-4 w-4" /> Delete Card
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
