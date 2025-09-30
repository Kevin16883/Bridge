import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/">
            <a className="flex items-center gap-2 font-bold text-xl" data-testid="link-home">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                B
              </div>
              Bridge
            </a>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/how-it-works">
              <a className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-how-it-works">
                工作原理
              </a>
            </Link>
            <Link href="/for-providers">
              <a className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-for-providers">
                需求方
              </a>
            </Link>
            <Link href="/for-performers">
              <a className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-for-performers">
                任务执行者
              </a>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" className="hidden md:inline-flex" data-testid="button-login">
            登录
          </Button>
          <Button data-testid="button-get-started">开始使用</Button>
          <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
