"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/shared/user-avatar";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { Badge } from "@/components/ui/badge";
import { useBoardContext } from "@/lib/board-context";

export default function BacklogPage() {
  const { cards, columns, users, loading, currentBoard } = useBoardContext();

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Backlog</h1>
      {cards.length === 0 ? (
        <p className="text-muted-foreground">No cards yet. Create one from the Board view.</p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((card) => {
                const owner = users.find((u) => u.id === card.owner_id);
                const col = columns.find((c) => c.id === card.column_id);
                return (
                  <TableRow key={card.id}>
                    <TableCell className="font-medium">{card.title}</TableCell>
                    <TableCell>
                      <PriorityBadge priority={card.priority} textVisible />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{col?.name ?? "Unknown"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserAvatar user={owner} className="h-6 w-6" />
                        <span className="text-sm">{owner?.name || "Unassigned"}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
