import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ScrollArea } from "./ui/scroll-area";
import { Bell, Check } from "lucide-react";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  created_at: string;
  content: string;
  type: string;
  is_read: boolean;
}

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setNotifications(data);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
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
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllAsRead = async () => {
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    // Dispatch event to update the counter in the header
    window.dispatchEvent(new Event("notificationsRead"));
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );

    // Dispatch event to update the counter in the header
    window.dispatchEvent(new Event("notificationsRead"));
  };

  // Mark notification as read when clicked
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
  };

  // Mark all visible notifications as read when panel opens
  useEffect(() => {
    const markVisibleAsRead = async () => {
      if (!user || notifications.length === 0) return;

      const unreadNotifications = notifications.filter((n) => !n.is_read);
      if (unreadNotifications.length === 0) return;

      // Mark all unread notifications as read
      await markAllAsRead();

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      // Dispatch event to update the counter in the header
      window.dispatchEvent(new Event("notificationsRead"));
    };

    // Small delay to ensure the panel is fully visible before marking as read
    const timer = setTimeout(markVisibleAsRead, 500);
    return () => clearTimeout(timer);
  }, [notifications.length, user]);

  return (
    <ScrollArea className="h-[400px] w-[350px] p-4">
      {notifications.length > 0 && (
        <div className="flex justify-end mb-4">
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        </div>
      )}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent/50 ${notification.is_read ? "bg-background" : "bg-accent"}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex-1">
                <p className="text-sm">{notification.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                  }}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
