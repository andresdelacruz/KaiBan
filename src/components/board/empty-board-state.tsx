"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { useBoardContext } from "@/lib/board-context";

export function EmptyBoardState() {
  const { createBoard } = useBoardContext();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createBoard(name.trim());
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm">
        <Icons.board className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">No boards yet</h2>
        <p className="text-muted-foreground text-sm">
          Create your first board to get started.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="Board name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={creating || !name.trim()}>
            {creating ? "Creating…" : "Create"}
          </Button>
        </div>
      </div>
    </main>
  );
}
