import React, { useEffect, useState } from "react";
import Header from "./Header";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { clearImageFromCache } from "@/lib/image-utils";
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
import PrayerRequestDetail from "./PrayerRequestDetail";
import SEO from "./SEO";

interface PrayerRequest {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_public: boolean;
  image_url?: string | null;
  profiles: {
    username: string;
    avatar_url?: string | null;
  };
  prayer_count?: number;
  comment_count?: number;
  _timestamp?: number; // For forcing re-renders
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
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // References for file inputs
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  // Function to fetch prayed requests
  const fetchPrayedRequests = async () => {
    if (!user) return;

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

  // Function to fetch user prayer requests
  const fetchUserPrayerRequests = async () => {
    if (!user) return;
    setIsLoading(true);

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
        .not('content', 'eq', '[Deleted]') // Filter out posts marked as deleted
        .order("created_at", { ascending: false });

      console.log("Fetched user prayer requests:", data);

      if (error) throw error;

      if (data) {
        setPrayerRequests(
          data.map((request) => ({
            ...request,
            prayer_count: request.prayer_interactions?.[0]?.count || 0,
            comment_count: request.comments?.[0]?.count || 0,
            // Add a timestamp to force refresh of the component when data changes
            _timestamp: Date.now(),
          })),
        );
      }
    } catch (error) {
      console.error("Error fetching user prayer requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

    // Fetch data
    fetchProfile();
    fetchUserPrayerRequests();
    fetchPrayedRequests();

    // Subscribe to realtime changes for prayer_requests
    const channel = supabase
      .channel("profile_prayer_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prayer_requests", filter: `user_id=eq.${user.id}` },
        () => {
          console.log("Realtime update detected in profile, refreshing prayer requests");
          fetchUserPrayerRequests();
        }
      )
      .subscribe();

    return () => {
      // Cleanup
      supabase.removeChannel(channel);
    };
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

  // Handle prayer click (react to a prayer request)
  const handlePrayerClick = async (request: PrayerRequest) => {
    if (!user) return;

    try {
      const hasPrayed = prayedRequests.has(request.id);

      // Optimistically update UI
      const newPrayedRequests = new Set(prayedRequests);
      if (hasPrayed) {
        newPrayedRequests.delete(request.id);
      } else {
        newPrayedRequests.add(request.id);
      }
      setPrayedRequests(newPrayedRequests);

      // Optimistically update prayer count
      setPrayerRequests(prev =>
        prev.map(r => {
          if (r.id === request.id) {
            return {
              ...r,
              prayer_count: (r.prayer_count || 0) + (hasPrayed ? -1 : 1)
            };
          }
          return r;
        })
      );

      if (hasPrayed) {
        // Remove prayer interaction
        const { error } = await supabase
          .from("prayer_interactions")
          .delete()
          .eq("prayer_request_id", request.id)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Add prayer interaction
        const { error } = await supabase
          .from("prayer_interactions")
          .insert({
            prayer_request_id: request.id,
            user_id: user.id,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error toggling prayer:", error);

      // Revert optimistic updates on error
      await fetchUserPrayerRequests();
      await fetchPrayedRequests();

      toast({
        title: "Error",
        description: "Failed to update prayer status",
        variant: "destructive",
      });
    }
  };

  // Handle comment added
  const handleCommentAdded = () => {
    // Update the comment count for the selected request
    if (selectedRequest) {
      setPrayerRequests(prev =>
        prev.map(r => {
          if (r.id === selectedRequest.id) {
            return {
              ...r,
              comment_count: (r.comment_count || 0) + 1
            };
          }
          return r;
        })
      );

      // Update the selected request
      setSelectedRequest(prev =>
        prev
          ? {
            ...prev,
            comment_count: (prev.comment_count || 0) + 1,
          }
          : null
      );
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      console.log("Deleting prayer request from profile:", requestId);

      // First, verify the prayer request exists and belongs to the user
      const { data: verifyData, error: verifyError } = await supabase
        .from("prayer_requests")
        .select("id, user_id, image_url")
        .eq("id", requestId)
        .single();

      console.log("Verification data from profile:", verifyData);

      if (verifyError) {
        console.error("Error verifying prayer request from profile:", verifyError);
        throw new Error("Could not verify prayer request ownership");
      }

      if (!verifyData) {
        throw new Error("Prayer request not found");
      }

      // Check if the user owns this prayer request
      if (verifyData.user_id !== user.id) {
        throw new Error("You don't have permission to delete this prayer request");
      }

      // Optimistically update UI
      setPrayerRequests((prev) => prev.filter((r) => r.id !== requestId));

      // If there's an image associated with this prayer request, delete it from storage
      if (verifyData.image_url) {
        try {
          // First, try to clear the image from browser cache
          clearImageFromCache(verifyData.image_url);

          // Extract the file path from the URL
          // The URL format is typically: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
          const imageUrl = verifyData.image_url;
          console.log("Image URL to delete from profile:", imageUrl);

          // Try a different approach to delete the image
          // First, let's try to determine if this is a Supabase storage URL
          if (imageUrl.includes('supabase')) {
            // This appears to be a Supabase URL
            console.log("Detected Supabase storage URL in profile");

            // Extract the path from the URL
            const urlParts = imageUrl.split('/storage/v1/object/public/');
            if (urlParts.length > 1) {
              const pathParts = urlParts[1].split('/');
              const bucket = pathParts[0];
              const filePath = pathParts.slice(1).join('/');

              console.log("Attempting to delete file from profile - Bucket:", bucket, "Path:", filePath);

              // First, list files to verify the file exists
              const { data: fileList, error: listError } = await supabase
                .storage
                .from(bucket)
                .list(filePath.split('/').slice(0, -1).join('/') || undefined);

              console.log("Files in directory (profile):", fileList);

              if (listError) {
                console.error("Error listing files in bucket (profile):", listError);
              }

              // Now try to delete the file
              const { data: deleteData, error: storageError } = await supabase
                .storage
                .from(bucket)
                .remove([filePath]);

              console.log("Delete response (profile):", deleteData);

              if (storageError) {
                console.error("Error deleting image from storage (profile):", storageError);

                // Try an alternative approach - delete all files in the user's directory
                const userPath = filePath.split('/')[0]; // This should be the user ID
                console.log("Attempting to delete all files for user (profile):", userPath);

                const { data: userFiles, error: userListError } = await supabase
                  .storage
                  .from(bucket)
                  .list(userPath);

                if (userListError) {
                  console.error("Error listing user files (profile):", userListError);
                } else if (userFiles && userFiles.length > 0) {
                  console.log("Found user files (profile):", userFiles);

                  const filesToDelete = userFiles.map(file => `${userPath}/${file.name}`);
                  console.log("Attempting to delete these files (profile):", filesToDelete);

                  const { data: bulkDeleteData, error: bulkDeleteError } = await supabase
                    .storage
                    .from(bucket)
                    .remove(filesToDelete);

                  if (bulkDeleteError) {
                    console.error("Error bulk deleting files (profile):", bulkDeleteError);
                  } else {
                    console.log("Bulk delete successful (profile):", bulkDeleteData);
                  }
                }
              } else {
                console.log("Image deleted successfully from storage (profile)");
              }
            } else {
              console.error("Could not parse Supabase URL correctly (profile)");
            }
          } else {
            console.log("Not a Supabase storage URL, might be an external image (profile)");
          }
        } catch (storageError) {
          console.error("Error processing image deletion (profile):", storageError);
          // Continue with the prayer request deletion even if image deletion fails
        }
      }

      // First, update the prayer request to remove the image_url
      const { error: updateError } = await supabase
        .from("prayer_requests")
        .update({ image_url: null })
        .eq("id", requestId);

      if (updateError) {
        console.error("Error updating prayer request to remove image_url (profile):", updateError);
        // Continue with deletion anyway
      } else {
        console.log("Successfully removed image_url from prayer request (profile)");
      }

      // Use the RPC function to delete the prayer request and all related records
      console.log("Using RPC function to delete prayer request ID (profile):", requestId);

      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('delete_prayer_request', { prayer_request_id: requestId });

      console.log("RPC delete result (profile):", rpcResult, "Error:", rpcError);

      if (rpcError) {
        console.error("RPC delete failed (profile):", rpcError);

        // Fall back to manual deletion
        console.log("Falling back to manual deletion process (profile)...");

        // First, delete related prayer interactions
        const { error: interactionsError } = await supabase
          .from("prayer_interactions")
          .delete()
          .eq("prayer_request_id", requestId);

        if (interactionsError) {
          console.error("Error deleting related interactions (profile):", interactionsError);
        } else {
          console.log("Successfully deleted related interactions (profile)");
        }

        // Then, delete related comments
        const { error: commentsError } = await supabase
          .from("comments")
          .delete()
          .eq("prayer_request_id", requestId);

        if (commentsError) {
          console.error("Error deleting related comments (profile):", commentsError);
        } else {
          console.log("Successfully deleted related comments (profile)");
        }

        // Finally, delete the prayer request itself
        const { error: deleteError } = await supabase
          .from("prayer_requests")
          .delete()
          .eq("id", requestId);

        if (deleteError) {
          console.error("Manual delete failed (profile):", deleteError);

          // Last resort: mark as deleted
          const { error: updateError } = await supabase
            .from("prayer_requests")
            .update({
              content: "[Deleted]",
              image_url: null,
              is_public: false
            })
            .eq("id", requestId);

          if (updateError) {
            console.error("Update as deleted also failed (profile):", updateError);
            throw new Error("All deletion methods failed");
          } else {
            console.log("Successfully marked prayer request as deleted (profile)");
          }
        } else {
          console.log("Successfully deleted prayer request manually (profile)");
        }
      } else {
        console.log("Successfully deleted prayer request using RPC (profile)");
      }

      // Verify the prayer request was actually deleted
      const { data: checkData } = await supabase
        .from("prayer_requests")
        .select("id")
        .eq("id", requestId)
        .maybeSingle();

      console.log("Post-deletion verification result (profile):", checkData);

      if (checkData) {
        console.warn("Prayer request still exists after deletion attempt (profile)!");
        // Don't throw an error, just log it
        console.log("Will rely on UI filtering to hide this post (profile)");
      } else {
        console.log("Confirmed prayer request was successfully deleted (profile)");
      }

      console.log("Prayer request deleted successfully from profile");

      // Force a refresh of the prayer requests
      await fetchUserPrayerRequests();

      toast({
        title: "Success",
        description: "Prayer request deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting prayer request from profile:", error);

      // Revert optimistic update by refetching
      await fetchUserPrayerRequests();

      toast({
        title: "Error",
        description: typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : "Failed to delete prayer request",
        variant: "destructive",
      });
    }
  };

  // The fetchUserPrayerRequests function is now defined at the top of the component

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
      <SEO
        title={`${profile.username || "User"}'s Profile | CryOutNow`}
        description={`View ${profile.username || "User"}'s prayer requests and activity on CryOutNow. Connect and pray together in our supportive community.`}
        canonical="/profile"
      />
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
                  id={request.id}
                  content={request.content}
                  username={request.profiles?.username || "Anonymous"}
                  timestamp={request.created_at}
                  isPrivate={!request.is_public}
                  prayerCount={request.prayer_count || 0}
                  commentCount={request.comment_count || 0}
                  hasPrayed={prayedRequests.has(request.id)}
                  imageUrl={request.image_url}
                  avatarUrl={request.profiles?.avatar_url}
                  isOwner={true} // In profile page, all requests belong to the user
                  onPrayClick={() => handlePrayerClick(request)}
                  onCommentClick={() => setSelectedRequest(request)}
                  onDeleteClick={handleDeleteRequest}
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

        {/* Prayer Request Detail - Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
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
                onCommentAdded={handleCommentAdded}
                onDeleteClick={handleDeleteRequest}
                isOwner={true}
                imageUrl={selectedRequest.image_url}
                avatarUrl={selectedRequest.profiles?.avatar_url}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
