import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserAvatarProps = {
  avatarUrl?: string | null;
  username: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
};

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export function UserAvatar({ avatarUrl, username, className = "", size = "md", onClick }: UserAvatarProps) {
  return (
    <Avatar 
      className={`${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer hover-elevate' : ''}`}
      onClick={onClick}
    >
      {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
      <AvatarFallback>
        {username.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
