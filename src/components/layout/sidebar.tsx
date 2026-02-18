"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBoardContext } from "@/lib/board-context";

export function AppSidebar() {
  const pathname = usePathname();
  const { currentUser, boards, currentBoard, selectBoard } = useBoardContext();

  const navItems = [
    { href: "/", label: "Board", icon: Icons.board },
    { href: "/backlog", label: "Backlog", icon: Icons.backlog },
    { href: "/settings", label: "Settings", icon: Icons.settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start text-left h-auto py-2 px-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {currentBoard?.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-sm text-foreground">
                      {currentBoard?.name ?? "No board"}
                    </span>
                    <span className="text-xs text-muted-foreground">KanbanZen</span>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>Boards</DropdownMenuLabel>
              {boards.length === 0 && (
                <DropdownMenuItem disabled>No boards</DropdownMenuItem>
              )}
              {boards.map((board) => (
                <DropdownMenuItem key={board.id} onClick={() => selectBoard(board)}>
                  {board.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => (
              <Link href={item.href} key={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start h-auto py-2 px-3">
               <div className="flex items-center gap-3 w-full">
                  <UserAvatar
                    user={currentUser ? { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl } : undefined}
                    className="w-8 h-8"
                  />
                  <span className="text-sm font-medium text-foreground truncate">
                    {currentUser?.name ?? "Not signed in"}
                  </span>
               </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
