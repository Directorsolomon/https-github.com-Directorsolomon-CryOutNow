import React, { useEffect, useState } from "react";
import Header from "./Header";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import PrayerRequestCard from "./PrayerRequestCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import {
  Camera,
  Mail,
  User as UserIcon,
  ArrowLeft,
  Upload,
  Home,
} from "lucide-react";
import { useToast } from "./ui/use-toast";
import { useNavigate } from "react-router-dom";

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

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  cover_url: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [prayedRequests, setPrayedRequests] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // References for file inputs
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          // Create profile if it doesn't exist
          await createProfile();
          return;
        }

        if (data) setProfile(data);
      } catch (error) {
        console.error("Error in profile fetch:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const createProfile = async () => {
      try {
        const { error } = await supabase.from("profiles").insert({
          id: user.id,
          username: user.email?.split("@")[0] || "user",
          full_name: user.user_metadata?.full_name || "Anonymous",
          avatar_url: null,
          cover_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;

        // Fetch the newly created profile
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) setProfile(data);
      } catch (error) {
        console.error("Error creating profile:", error);
        toast({
          title: "Error",
          description: "Failed to create user profile",
          variant: "destructive",
        });
      }
    };

    const fetchPrayerRequests = async () => {
      try {
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
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (data) {
          setPrayerRequests(
            data.map((request) => ({
              ...request,
              prayer_count: request.prayer_interactions?.[0]?.count || 0,
              comment_count: request.comments?.[0]?.count || 0,
            })),
          );
        }
      } catch (error) {
        console.error("Error fetching prayer requests:", error);
      }
    };

    const fetchPrayedRequests = async () => {
      try {
        const { data, error } = await supabase
          .from("prayer_interactions")
          .select("prayer_request_id")
          .eq("user_id", user.id);

        if (error) throw error;

        if (data) {
          setPrayedRequests(
            new Set(data.map((item) => item.prayer_request_id)),
          );
        }
      } catch (error) {
        console.error("Error fetching prayed requests:", error);
      }
    };

    fetchProfile();
    fetchPrayerRequests();
    fetchPrayedRequests();
  }, [user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // Ensure storage bucket exists
  const ensureStorageBucketExists = async () => {
    try {
      const { data, error } = await supabase.storage.getBucket("profiles");

      if (error && error.message.includes("not found")) {
        await supabase.storage.createBucket("profiles", { public: true });
      }
      return true;
    } catch (error) {
      console.error("Error checking/creating bucket:", error);
      return false;
    }
  };

  // Handle file uploads
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user!.id}/avatar-${Date.now()}.${fileExt}`;

      setUploadingAvatar(true);

      // Ensure bucket exists
      const bucketExists = await ensureStorageBucketExists();
      if (!bucketExists) {
        throw new Error("Failed to create storage bucket");
      }

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage.from("profiles").getPublicUrl(filePath);

      if (!data || !data.publicUrl) {
        throw new Error("Failed to get public URL for avatar");
      }

      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user!.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile((prev) =>
        prev ? { ...prev, avatar_url: data.publicUrl } : null,
      );

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const uploadCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user!.id}/cover-${Date.now()}.${fileExt}`;

      setUploadingCover(true);

      // Ensure bucket exists
      const bucketExists = await ensureStorageBucketExists();
      if (!bucketExists) {
        throw new Error("Failed to create storage bucket");
      }

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage.from("profiles").getPublicUrl(filePath);

      if (!data || !data.publicUrl) {
        throw new Error("Failed to get public URL for cover image");
      }

      // Update the profile with the new cover URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_url: data.publicUrl })
        .eq("id", user!.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile((prev) =>
        prev ? { ...prev, cover_url: data.publicUrl } : null,
      );

      toast({
        title: "Success",
        description: "Cover image updated successfully",
      });
    } catch (error) {
      console.error("Error uploading cover:", error);
      toast({
        title: "Error",
        description: `Failed to upload cover image: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userName={profile.username || "Guest"} />

      <main className="pt-[72px] max-w-4xl mx-auto p-4 md:p-8">
        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/home")}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/home")}
              className="flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
          </div>
          <h2 className="text-xl font-semibold">Profile</h2>
          <div className="w-[60px]"></div> {/* Spacer for alignment */}
        </div>

        {/* Profile Header */}
        <div className="relative mb-8">
          {/* Cover Image */}
          <div className="relative h-48 rounded-lg overflow-hidden">
            {profile.cover_url && profile.cover_url.trim() !== "" ? (
              <img
                src={profile.cover_url}
                alt="Cover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80";
                }}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-r from-primary/20 to-primary/30" />
            )}

            {/* Cover upload button */}
            <Button
              size="sm"
              variant="secondary"
              className="absolute bottom-2 right-2"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
            >
              {uploadingCover ? (
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Change Cover
            </Button>
            <input
              type="file"
              ref={coverInputRef}
              onChange={uploadCover}
              className="hidden"
              accept="image/*"
            />
          </div>

          {/* Profile Info */}
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 px-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center text-4xl overflow-hidden">
                {profile.avatar_url && profile.avatar_url.trim() !== "" ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username || "User"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username || profile.id}`;
                    }}
                  />
                ) : (
                  profile.username?.charAt(0) || "?"
                )}
              </div>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              <input
                type="file"
                ref={avatarInputRef}
                onChange={uploadAvatar}
                className="hidden"
                accept="image/*"
              />
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>

            <Button className="md:self-center" variant="outline">
              Edit Profile
            </Button>
          </div>

          {/* Profile Details */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="prayers" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="prayers">Prayer Requests</TabsTrigger>
            <TabsTrigger value="interactions">Interactions</TabsTrigger>
          </TabsList>

          <TabsContent value="prayers" className="mt-6 space-y-4">
            {prayerRequests.length > 0 ? (
              prayerRequests.map((request) => (
                <PrayerRequestCard
                  key={request.id}
                  content={request.content}
                  username={request.profiles?.username || "Anonymous"}
                  timestamp={request.created_at}
                  isPrivate={!request.is_public}
                  prayerCount={request.prayer_count || 0}
                  commentCount={request.comment_count || 0}
                  hasPrayed={prayedRequests.has(request.id)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No prayer requests yet</p>
                <Button variant="outline" className="mt-4">
                  Create Your First Prayer Request
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="interactions" className="mt-6">
            <div className="text-center py-8 text-muted-foreground">
              <p>Coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
