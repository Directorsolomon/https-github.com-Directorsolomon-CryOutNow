import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import NotificationsPanel from "./NotificationsPanel";
import { Input } from "./ui/input";
import OptimizedAvatar from "./OptimizedAvatar";
import { imageCache } from "@/lib/image-cache";
import {
  Search,
  Bell,
  BellDot,
  Menu,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuClick?: () => void;
  onSearchChange?: (value: string) => void;
  userName?: string;
  avatarUrl?: string | null;
}

const HeaderInner = ({
  onMenuClick = () => { },
  onSearchChange = () => { },
  userName = "Guest",
  avatarUrl = null,
}: HeaderProps = {}) => {
  const { signOut, user } = useAuth();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(
    avatarUrl,
  );
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) return;

    // Fetch user profile to get avatar URL if not provided
    const fetchUserProfile = async () => {
      if (avatarUrl === null) {
        try {
          // First check if we have the avatar URL in cache
          if (imageCache.has(user.id)) {
            console.log('Using cached avatar URL from image cache');
            setProfileAvatarUrl(imageCache.get(user.id));
            return;
          }

          console.log('Fetching avatar URL from database');
          const { data, error } = await supabase
            .from("profiles")
            .select("avatar_url")
            .eq("id", user.id)
            .single();

          if (!error && data && data.avatar_url) {
            console.log('Avatar URL fetched, setting and caching it');
            setProfileAvatarUrl(data.avatar_url);
            imageCache.set(user.id, data.avatar_url);

            // Preload the image
            imageCache.preloadImage(data.avatar_url)
              .catch(err => console.error('Error preloading avatar image:', err));
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    fetchUserProfile();

    // Initial fetch of unread notifications
    const fetchUnreadCount = async () => {
      try {
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        setUnreadCount(count || 0);
      } catch (error) {
        console.error("Error fetching unread count:", error);
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();

    // Subscribe to notifications changes
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchUnreadCount(),
      )
      .subscribe();

    // Set up an event listener for when notifications are read
    const handleNotificationsRead = () => {
      console.log("Notifications read event received");
      fetchUnreadCount();
    };

    window.addEventListener("notificationsRead", handleNotificationsRead);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("notificationsRead", handleNotificationsRead);
    };
  }, [user]);

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

      <div className="hidden md:flex flex-1 max-w-xl mx-4">
        <div className="relative w-full">
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
            <Button variant="ghost" size="icon" className="relative">
              {unreadCount > 0 ? (
                <>
                  <BellDot className="h-5 w-5" />
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                </>
              ) : (
                <Bell className="h-5 w-5" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[400px] p-0">
            <NotificationsPanel />
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <OptimizedAvatar
                src={profileAvatarUrl}
                alt={userName}
                fallback={userName.charAt(0)}
                size="sm"
              />
              <span className="hidden sm:inline">{userName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => navigate("/profile")}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={async () => {
                await signOut();
                navigate("/");
              }}
              className="text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

const Header = (props: HeaderProps) => {
  return <HeaderInner {...props} />;
};

export default Header;
