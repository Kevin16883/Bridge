import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { NotificationsDropdown } from "./notifications-dropdown";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/auth");
      },
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl" data-testid="link-home">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              B
            </div>
            Bridge
          </Link>
          {user && (
            <nav className="hidden md:flex items-center gap-6">
              {user.role === "provider" && (
                <>
                  <Link href="/provider-dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-dashboard">
                    Dashboard
                  </Link>
                  <Link href="/create-demand" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-create-demand">
                    Create Demand
                  </Link>
                </>
              )}
              {user.role === "performer" && (
                <>
                  <Link href="/performer-dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-dashboard">
                    Dashboard
                  </Link>
                  <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-tasks">
                    Browse Tasks
                  </Link>
                  <Link href="/applications" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-applications">
                    My Applications
                  </Link>
                </>
              )}
              <Link href="/community" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-community">
                Community
              </Link>
              <Link href="/messages" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-messages">
                Messages
              </Link>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && <NotificationsDropdown />}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2" data-testid="button-user-menu">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.username}</span>
                    <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/auth">
                <Button variant="ghost" className="hidden md:inline-flex" data-testid="button-login">
                  Login
                </Button>
              </Link>
              <Link href="/auth">
                <Button data-testid="button-get-started">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
