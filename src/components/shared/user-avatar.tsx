import { User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";

interface UserAvatarProps {
  user: User | null | undefined;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  if (!user) {
    return (
      <Avatar className={cn("bg-muted", className)}>
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("");
  };

  const placeholderImage = PlaceHolderImages.find(img => img.id === user.avatarUrl);

  return (
    <Avatar className={cn(className)}>
      {placeholderImage && <AvatarImage src={placeholderImage.imageUrl} alt={user.name} />}
      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
    </Avatar>
  );
}
