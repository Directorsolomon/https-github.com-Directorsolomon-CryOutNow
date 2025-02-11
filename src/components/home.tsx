import React from "react";
import Header from "./Header";
import PrayerRequestForm from "./PrayerRequestForm";
import PrayerRequestCard from "./PrayerRequestCard";
import PrayerRequestDetail from "./PrayerRequestDetail";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Plus, Home as HomeIcon, Search, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, AuthProvider } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "./ui/use-toast";

interface HomeProps {
  showNewRequestDialog?: boolean;
}

interface PrayerRequest {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_public: boolean;
  profiles: {
    username: string;
  };
  prayer_count?: number;
  comment_count?: number;
}

const SidebarLink = ({
  children,
  active = false,
}: {
  children: React.ReactNode;
  active?: boolean;
}) => (
  <Button
    variant="ghost"
    className={cn("w-full justify-start gap-4 px-4", active && "bg-accent")}
  >
    {children}
  </Button>
);

const HomeInner = ({ showNewRequestDialog = false }: HomeProps) => {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] =
    React.useState<PrayerRequest | null>(null);
  const [prayedRequests, setPrayedRequests] = React.useState<Set<string>>(
    new Set(),
  );
  const [isDialogOpen, setIsDialogOpen] = React.useState(showNewRequestDialog);
  const { user } = useAuth();
  const [username, setUsername] = React.useState<string>("");
  const [prayerRequests, setPrayerRequests] = React.useState<PrayerRequest[]>(
    [],
  );

  React.useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return;
      }

      if (data) {
        setUsername(data.username);
      }
    };

    fetchUserProfile();
  }, [user]);

  React.useEffect(() => {
    const fetchPrayedRequests = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("prayer_interactions")
        .select("prayer_request_id")
        .eq("user_id", user.id);

      if (data) {
        setPrayedRequests(new Set(data.map((item) => item.prayer_request_id)));
      }
    };

    fetchPrayedRequests();
  }, [user]);

  const fetchPrayerRequests = async () => {
    const { data, error } = await supabase
      .from("prayer_requests")
      .select(
        `
        *,
        profiles (username),
        prayer_interactions:prayer_interactions(count),
        comments:comments(count)
      `,
      )
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching prayer requests:", error);
      return;
    }

    if (data) {
      setPrayerRequests(
        data.map((request) => ({
          ...request,
          prayer_count: request.prayer_interactions?.[0]?.count || 0,
          comment_count: request.comments?.[0]?.count || 0,
        })),
      );
    }
  };

  React.useEffect(() => {
    fetchPrayerRequests();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("prayer_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prayer_requests" },
        () => fetchPrayerRequests(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePrayerClick = async (request: PrayerRequest) => {
    if (!user) return;

    const hasPrayed = prayedRequests.has(request.id);

    // Optimistically update UI
    setPrayedRequests((prev) => {
      const next = new Set(prev);
      if (hasPrayed) {
        next.delete(request.id);
      } else {
        next.add(request.id);
      }
      return next;
    });

    // Optimistically update prayer count
    setPrayerRequests((prev) =>
      prev.map((r) =>
        r.id === request.id
          ? {
              ...r,
              prayer_count: (r.prayer_count || 0) + (hasPrayed ? -1 : 1),
            }
          : r,
      ),
    );

    try {
      if (hasPrayed) {
        await supabase
          .from("prayer_interactions")
          .delete()
          .eq("user_id", user.id)
          .eq("prayer_request_id", request.id);
      } else {
        const { error } = await supabase.from("prayer_interactions").insert({
          user_id: user.id,
          prayer_request_id: request.id,
        });

        if (!error) {
          toast({
            title: "Prayer Recorded",
            description: "Your prayer support has been recorded.",
          });

          // Send notification to the prayer request owner
          await supabase.from("notifications").insert({
            user_id: request.user_id,
            type: "prayer",
            content: `${username || "Someone"} is praying for your request`,
            related_id: request.id,
          });
        }
      }
    } catch (error) {
      // Revert optimistic updates if the API call fails
      setPrayedRequests((prev) => {
        const next = new Set(prev);
        if (hasPrayed) {
          next.add(request.id);
        } else {
          next.delete(request.id);
        }
        return next;
      });

      setPrayerRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? {
                ...r,
                prayer_count: (r.prayer_count || 0) + (hasPrayed ? 1 : -1),
              }
            : r,
        ),
      );

      toast({
        title: "Error",
        description: "Failed to update prayer status. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userName={username || "Guest"} />

      {/* Main Content */}
      <main className="pt-[72px] grid grid-cols-1 md:grid-cols-[auto,1fr,auto] max-w-7xl mx-auto gap-4">
        {/* Left Sidebar */}
        <aside className="hidden md:flex flex-col gap-2 p-4 sticky top-[72px] h-[calc(100vh-72px)]">
          <SidebarLink active>
            <HomeIcon className="h-5 w-5" /> Home
          </SidebarLink>
          <SidebarLink>
            <Search className="h-5 w-5" /> Explore
          </SidebarLink>
          <SidebarLink>
            <Bell className="h-5 w-5" /> Notifications
          </SidebarLink>
          <SidebarLink>
            <User className="h-5 w-5" /> Profile
          </SidebarLink>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="mt-4">
                New Prayer Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <AuthProvider>
                <PrayerRequestForm
                  onSubmit={() => {
                    setIsDialogOpen(false);
                    fetchPrayerRequests();
                  }}
                />
              </AuthProvider>
            </DialogContent>
          </Dialog>
        </aside>

        {/* Main Feed */}
        <div className="min-h-[calc(100vh-72px)] border-x">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Home</h2>
          </div>
          <div className="max-w-2xl mx-auto space-y-4 p-4">
            {selectedRequest ? (
              <PrayerRequestDetail
                requestId={selectedRequest.id}
                content={selectedRequest.content}
                username={selectedRequest.profiles?.username || "Anonymous"}
                timestamp={selectedRequest.created_at}
                prayerCount={selectedRequest.prayer_count || 0}
                isPrivate={!selectedRequest.is_public}
                onBack={() => setSelectedRequest(null)}
                onPrayClick={() => handlePrayerClick(selectedRequest)}
                hasPrayed={prayedRequests.has(selectedRequest.id)}
              />
            ) : (
              prayerRequests.map((request) => (
                <div key={request.id} className="p-4">
                  <PrayerRequestCard
                    content={request.content}
                    username={request.profiles?.username || "Anonymous"}
                    timestamp={request.created_at}
                    isPrivate={!request.is_public}
                    prayerCount={request.prayer_count || 0}
                    commentCount={request.comment_count || 0}
                    hasPrayed={prayedRequests.has(request.id)}
                    onPrayClick={() => handlePrayerClick(request)}
                    onCommentClick={() => setSelectedRequest(request)}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="hidden lg:block w-[350px] p-4 sticky top-[72px] h-[calc(100vh-72px)]">
          <div className="space-y-6">
            {/* Featured Section */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">Featured</h3>
              <div className="bg-card rounded-lg overflow-hidden shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1519834785169-98be25ec3f84?q=80&w=2000"
                  alt="Daily Devotional"
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    FEATURED
                  </div>
                  <h4 className="font-semibold mb-2">Daily Devotional App</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start your day with inspiring devotionals. Join millions of
                    Christians worldwide.
                  </p>
                  <Button variant="secondary" className="w-full">
                    Download Now
                  </Button>
                </div>
              </div>
            </div>

            {/* Community Events */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">Community Events</h3>
              <div className="bg-card rounded-lg overflow-hidden shadow-md">
                <div className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    COMMUNITY
                  </div>
                  <h4 className="font-semibold mb-2">
                    Online Prayer Conference
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Join our global prayer conference. 24 hours continuous
                    prayer.
                  </p>
                  <Button variant="secondary" className="w-full">
                    Register Free
                  </Button>
                </div>
              </div>
            </div>

            {/* Sponsored */}
            <div>
              <h3 className="font-semibold mb-4 text-lg">Sponsored</h3>
              <div className="bg-card rounded-lg overflow-hidden shadow-md p-4">
                <div className="text-sm text-muted-foreground">
                  Advertisement space
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile FAB */}
        <div className="fixed bottom-6 right-6 md:hidden z-10">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <AuthProvider>
                <PrayerRequestForm
                  onSubmit={() => {
                    setIsDialogOpen(false);
                    fetchPrayerRequests();
                  }}
                />
              </AuthProvider>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

const Home = (props: HomeProps) => {
  return (
    <AuthProvider>
      <HomeInner {...props} />
    </AuthProvider>
  );
};

export default Home;
