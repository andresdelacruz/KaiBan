"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Priority } from "@/lib/types";
import { Icons } from "../icons";
import { useBoardContext } from "@/lib/board-context";
import * as api from "@/lib/api";

interface AICreateCardModalProps {
  children: React.ReactNode;
}

type Phase = "prompt" | "loading" | "preview";

export function AICreateCardModal({ children }: AICreateCardModalProps) {
  const { currentBoard, columns, refreshBoard } = useBoardContext();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("prompt");
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("P2");
  const [checklist, setChecklist] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const reset = () => {
    setPhase("prompt");
    setPrompt("");
    setTitle("");
    setDescription("");
    setPriority("P2");
    setChecklist([]);
    setError("");
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setPhase("loading");
    setError("");
    try {
      const res = await fetch("/api/ai/draft-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setTitle(data.title);
      setDescription(data.description);
      setPriority(data.priority);
      setChecklist(data.checklist ?? []);
      setPhase("preview");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate card");
      setPhase("prompt");
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !currentBoard || columns.length === 0) return;
    setCreating(true);
    try {
      const card = await api.createCard({
        boardId: currentBoard.id,
        columnId: columns[0].id,
        title: title.trim(),
        description,
        priority,
        ownerId: null,
      });
      // Add checklist items
      for (let i = 0; i < checklist.length; i++) {
        if (checklist[i].trim()) {
          await api.addChecklistItem(card.id, checklist[i].trim(), i);
        }
      }
      await refreshBoard();
      setOpen(false);
      reset();
    } catch (e) {
      console.error("Create card error:", e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>✨ Create Card with AI</DialogTitle>
        </DialogHeader>

        {phase === "prompt" && (
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="ai-prompt">Describe what you need</Label>
              <Textarea
                id="ai-prompt"
                placeholder="e.g. Add dark mode toggle to the settings page with persistence..."
                className="mt-1 h-24"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleGenerate())}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button onClick={handleGenerate} disabled={!prompt.trim()}>
                <Icons.sparkles className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </DialogFooter>
          </div>
        )}

        {phase === "loading" && (
          <div className="flex items-center justify-center py-12">
            <Icons.loader className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Generating card…</span>
          </div>
        )}

        {phase === "preview" && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Title</Label>
              <Input className="col-span-3" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["P0", "P1", "P2", "P3"] as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">Description</Label>
              <Textarea className="col-span-3 h-28" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right mt-2">Checklist</Label>
              <div className="col-span-3 space-y-1">
                {checklist.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      value={item}
                      onChange={(e) => { const c = [...checklist]; c[i] = e.target.value; setChecklist(c); }}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setChecklist(checklist.filter((_, j) => j !== i))}>
                      <Icons.trash className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="ghost" onClick={reset}>← Back</Button>
              <Button onClick={handleCreate} disabled={creating || !title.trim()}>
                {creating ? "Creating…" : "Create Card"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
