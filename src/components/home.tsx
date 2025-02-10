import React from "react";
import Header from "./Header";
import PrayerRequestForm from "./PrayerRequestForm";
import PrayerRequestCard from "./PrayerRequestCard";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Plus, Home as HomeIcon, Search, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, AuthProvider } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

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
    const fetchPrayerRequests = async () => {
      const { data, error } = await supabase
        .from("prayer_requests")
        .select(
          `
          *,
          profiles (
            username
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching prayer requests:", error);
        return;
      }

      if (data) {
        setPrayerRequests(data);
      }
    };

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
                  onSubmit={(data) => {
                    console.log(data);
                    setIsDialogOpen(false);
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
            {prayerRequests.map((request) => (
              <div key={request.id} className="p-4">
                <PrayerRequestCard
                  key={request.id}
                  content={request.content}
                  username={request.profiles?.username || "Anonymous"}
                  timestamp={request.created_at}
                  isPrivate={!request.is_public}
                  prayerCount={0}
                  onPrayClick={() => {
                    console.log("Prayed for request:", request.id);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="hidden lg:block w-[350px] p-4 sticky top-[72px] h-[calc(100vh-72px)]">
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-semibold mb-4">Most Prayed For</h3>
            {/* Add trending prayer requests here */}
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
                  onSubmit={(data) => {
                    console.log(data);
                    setIsDialogOpen(false);
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
