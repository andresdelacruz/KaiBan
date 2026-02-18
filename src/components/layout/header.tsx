"use client";

import { usePathname } from "next/navigation";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers";
import { NewCardModal } from "@/components/card/new-card-modal";

export function AppHeader() {
  const pathname = usePathname();
  const { theme, toggleTheme, density, toggleDensity } = useTheme();

  const getTitle = () => {
    switch (pathname) {
      case "/":
        return "Board";
      case "/backlog":
        return "Backlog";
      case "/settings":
        return "Settings";
      default:
        return "KanbanZen";
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6 flex-shrink-0">
      <h1 className="text-lg font-semibold text-foreground">{getTitle()}</h1>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "light" ? <Icons.moon className="h-4 w-4" /> : <Icons.sun className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleDensity}>
          {density === "comfortable" ? <Icons.minus className="h-4 w-4" /> : <Icons.columns className="h-4 w-4" />}
        </Button>
         <Button variant="ghost" size="icon">
          <Icons.download className="h-4 w-4" />
        </Button>
        <NewCardModal>
          <Button>
            <Icons.plus className="mr-2 h-4 w-4" />
            New Card
          </Button>
        </NewCardModal>
      </div>
    </header>
  );
}
