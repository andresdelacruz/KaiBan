"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Priority } from "@/lib/types";
import { Icons } from "../icons";
import { useBoardContext } from "@/lib/board-context";
import * as api from "@/lib/api";

interface NewCardModalProps {
  children: React.ReactNode;
}

export function NewCardModal({ children }: NewCardModalProps) {
  const { users, currentBoard, columns, refreshBoard } = useBoardContext();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState<string>("");
  const [priority, setPriority] = useState<Priority>("P2");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !currentBoard || columns.length === 0) return;
    setCreating(true);
    try {
      await api.createCard({
        boardId: currentBoard.id,
        columnId: columns[0].id, // first column
        title: title.trim(),
        description,
        priority,
        ownerId: ownerId || null,
      });
      await refreshBoard();
      setOpen(false);
      setTitle("");
      setDescription("");
      setOwnerId("");
      setPriority("P2");
    } catch (e) {
      console.error("Create card error:", e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>New Card</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              placeholder="Card title"
              className="col-span-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="owner" className="text-right">
              Owner
            </Label>
            <Select value={ownerId} onValueChange={setOwnerId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select an owner" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">
              Priority
            </Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {(["P0", "P1", "P2", "P3"] as Priority[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Add a description..."
              className="col-span-3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost">
            <Icons.file className="mr-2 h-4 w-4" />
            Create from template
          </Button>
          <Button onClick={handleCreate} disabled={creating || !title.trim()}>
            {creating ? "Creating…" : "Create Card"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
