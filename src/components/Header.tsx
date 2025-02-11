import React from "react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import NotificationsPanel from "./NotificationsPanel";
import { Input } from "./ui/input";
import { Search, Bell, Menu } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useAuth, AuthProvider } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface HeaderProps {
  onMenuClick?: () => void;
  onSearchChange?: (value: string) => void;
  userName?: string;
}

const HeaderInner = ({
  onMenuClick = () => {},
  onSearchChange = () => {},
  userName = "Guest",
}: HeaderProps = {}) => {
  const { signOut = () => {}, user } = useAuth() || {};

  return (
    <header className="w-full h-[72px] px-4 bg-background border-b flex items-center justify-between fixed top-0 left-0 z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">CryOutNow</h1>
      </div>

      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="w-full pl-10"
            placeholder="Search prayer requests..."
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[400px] p-0">
            <NotificationsPanel />
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                {userName.charAt(0)}
              </div>
              <span className="hidden sm:inline">{userName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem
              onSelect={async () => {
                await signOut();
                window.location.href = "/";
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

const Header = (props: HeaderProps = {}) => {
  return <HeaderInner {...props} />;
};

export default Header;
