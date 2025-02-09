import React from "react";
import Header from "./Header";
import PrayerRequestForm from "./PrayerRequestForm";
import PrayerRequestCard from "./PrayerRequestCard";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import {
  Plus,
  Home as HomeIcon,
  Search,
  Bell,
  User,
  MessageCircle,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface HomeProps {
  userName?: string;
  showNewRequestDialog?: boolean;
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

const Home = ({
  userName = "John Doe",
  showNewRequestDialog = false,
}: HomeProps) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(showNewRequestDialog);
  const { user } = useAuth();

  const [prayerRequests, setPrayerRequests] = React.useState([]);

  React.useEffect(() => {
    const fetchPrayerRequests = async () => {
      const { data, error } = await supabase
        .from("prayer_requests")
        .select(
          `
          *,
          user:user_id (*)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching prayer requests:", error);
        return;
      }

      setPrayerRequests(data || []);
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
      <Header userName={userName} />

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
              <PrayerRequestForm
                onSubmit={(data) => {
                  console.log(data);
                  setIsDialogOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </aside>

        {/* Main Feed */}
        <div className="min-h-[calc(100vh-72px)] border-x">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Home</h2>
          </div>
          <div className="divide-y">
            {prayerRequests.map((request) => (
              <div key={request.id} className="p-4">
                <PrayerRequestCard
                  title={request.title}
                  description={request.description}
                  category={request.category}
                  timestamp={request.created_at}
                  prayerCount={request.prayer_count || 0}
                  isPrivate={!request.is_public}
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
              <PrayerRequestForm
                onSubmit={(data) => {
                  console.log(data);
                  setIsDialogOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default Home;
