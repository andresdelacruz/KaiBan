import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cards, users } from "@/lib/mock-data";
import { UserAvatar } from "@/components/shared/user-avatar";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { Badge } from "@/components/ui/badge";

export default function BacklogPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Backlog</h1>
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
            return (
              <TableRow key={card.id}>
                <TableCell className="font-medium">{card.title}</TableCell>
                <TableCell>
                  <PriorityBadge priority={card.priority} textVisible />
                </TableCell>
                <TableCell><Badge variant="outline">{card.column_id.replace('col-', 'Status ')}</Badge></TableCell>
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
    </div>
  );
}
