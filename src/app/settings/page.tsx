"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { useBoardContext } from "@/lib/board-context";
import * as api from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import type { Column, Lane } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";

// ─── Columns Tab ───────────────────────────────────────────

function ColumnsManager() {
  const { currentBoard, columns, refreshBoard } = useBoardContext();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editWip, setEditWip] = useState("");

  const sorted = [...columns].sort((a, b) => a.order - b.order);

  const handleAdd = async () => {
    if (!newName.trim() || !currentBoard) return;
    await api.createColumn(currentBoard.id, newName.trim(), columns.length);
    setNewName("");
    refreshBoard();
  };

  const handleDelete = async (id: string) => {
    await api.deleteColumn(id);
    refreshBoard();
  };

  const handleUpdate = async (id: string) => {
    await api.updateColumn(id, {
      name: editName,
      wip_limit: editWip ? parseInt(editWip) : null,
    });
    setEditingId(null);
    refreshBoard();
  };

  const handleMove = async (col: Column, direction: -1 | 1) => {
    const idx = sorted.findIndex((c) => c.id === col.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    await api.updateColumn(sorted[idx].id, { order: sorted[swapIdx].order });
    await api.updateColumn(sorted[swapIdx].id, { order: sorted[idx].order });
    refreshBoard();
  };

  if (!currentBoard) return <p className="text-muted-foreground">Select a board first.</p>;

  return (
    <div className="space-y-4">
      {sorted.map((col, idx) => (
        <div key={col.id} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
          {editingId === col.id ? (
            <>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleUpdate(col.id)}
              />
              <Input
                value={editWip}
                onChange={(e) => setEditWip(e.target.value)}
                placeholder="WIP"
                className="w-20"
                type="number"
              />
              <Button size="sm" onClick={() => handleUpdate(col.id)}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
            </>
          ) : (
            <>
              <Icons.grip className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 font-medium">{col.name}</span>
              {col.wip_limit !== null && (
                <Badge variant="secondary">WIP: {col.wip_limit}</Badge>
              )}
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                disabled={idx === 0}
                onClick={() => handleMove(col, -1)}
              >
                ↑
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                disabled={idx === sorted.length - 1}
                onClick={() => handleMove(col, 1)}
              >
                ↓
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => {
                  setEditingId(col.id);
                  setEditName(col.name);
                  setEditWip(col.wip_limit?.toString() ?? "");
                }}
              >
                ✏️
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                onClick={() => handleDelete(col.id)}
              >
                <Icons.trash className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          placeholder="New column name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={!newName.trim()}>
          <Icons.plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}

// ─── Lanes Tab ─────────────────────────────────────────────

const LANE_COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
  "bg-green-500", "bg-emerald-500", "bg-teal-500", "bg-cyan-500",
  "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500",
  "bg-pink-500", "bg-rose-500",
];

function LanesManager() {
  const { currentBoard, lanes, refreshBoard } = useBoardContext();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(LANE_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const sorted = [...lanes].sort((a, b) => a.order - b.order);

  const handleAdd = async () => {
    if (!newName.trim() || !currentBoard) return;
    await api.createLane(currentBoard.id, newName.trim(), newColor, lanes.length);
    setNewName("");
    refreshBoard();
  };

  const handleDelete = async (id: string) => {
    await api.deleteLane(id);
    refreshBoard();
  };

  const handleUpdate = async (id: string) => {
    await api.updateLane(id, { name: editName, color: editColor });
    setEditingId(null);
    refreshBoard();
  };

  const handleMove = async (lane: Lane, direction: -1 | 1) => {
    const idx = sorted.findIndex((l) => l.id === lane.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    await api.updateLane(sorted[idx].id, { order: sorted[swapIdx].order });
    await api.updateLane(sorted[swapIdx].id, { order: sorted[idx].order });
    refreshBoard();
  };

  if (!currentBoard) return <p className="text-muted-foreground">Select a board first.</p>;

  return (
    <div className="space-y-4">
      {sorted.map((lane, idx) => (
        <div key={lane.id} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
          {editingId === lane.id ? (
            <>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleUpdate(lane.id)}
              />
              <div className="flex gap-1">
                {LANE_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`w-5 h-5 rounded-full ${c} ${editColor === c ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                    onClick={() => setEditColor(c)}
                  />
                ))}
              </div>
              <Button size="sm" onClick={() => handleUpdate(lane.id)}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
            </>
          ) : (
            <>
              <Icons.grip className="h-4 w-4 text-muted-foreground" />
              <div className={`w-4 h-4 rounded-full ${lane.color}`} />
              <span className="flex-1 font-medium">{lane.name}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => handleMove(lane, -1)}>↑</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === sorted.length - 1} onClick={() => handleMove(lane, 1)}>↓</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(lane.id); setEditName(lane.name); setEditColor(lane.color); }}>✏️</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(lane.id)}>
                <Icons.trash className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ))}
      <div className="flex gap-2 items-center">
        <Input
          placeholder="New lane name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1"
        />
        <div className="flex gap-1">
          {LANE_COLORS.slice(0, 7).map((c) => (
            <button
              key={c}
              className={`w-5 h-5 rounded-full ${c} ${newColor === c ? "ring-2 ring-offset-2 ring-primary" : ""}`}
              onClick={() => setNewColor(c)}
            />
          ))}
        </div>
        <Button onClick={handleAdd} disabled={!newName.trim()}>
          <Icons.plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}

// ─── Members Tab ───────────────────────────────────────────

function MembersManager() {
  const { currentBoard, users } = useBoardContext();
  const [members, setMembers] = useState<{ user_id: string; role: string }[]>([]);

  useEffect(() => {
    if (!currentBoard) return;
    api.getBoardMembers(currentBoard.id).then(setMembers).catch(console.error);
  }, [currentBoard]);

  if (!currentBoard) return <p className="text-muted-foreground">Select a board first.</p>;

  return (
    <div className="space-y-3">
      {members.length === 0 && <p className="text-muted-foreground">No members yet.</p>}
      {members.map((m) => {
        const user = users.find((u) => u.id === m.user_id);
        return (
          <div key={m.user_id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
            <UserAvatar user={user} className="h-8 w-8" />
            <span className="flex-1 font-medium">{user?.name ?? m.user_id}</span>
            <Badge variant="secondary">{m.role}</Badge>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Settings Page ────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Board Settings</h1>
      <Tabs defaultValue="columns">
        <TabsList>
          <TabsTrigger value="columns">Columns</TabsTrigger>
          <TabsTrigger value="lanes">Lanes</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="columns">
          <Card>
            <CardHeader>
              <CardTitle>Manage Columns</CardTitle>
            </CardHeader>
            <CardContent>
              <ColumnsManager />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="lanes">
          <Card>
            <CardHeader>
              <CardTitle>Manage Lanes</CardTitle>
            </CardHeader>
            <CardContent>
              <LanesManager />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Board Members</CardTitle>
            </CardHeader>
            <CardContent>
              <MembersManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
