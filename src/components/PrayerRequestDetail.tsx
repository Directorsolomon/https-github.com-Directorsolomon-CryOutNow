import { useEffect, useState, useMemo } from "react";
import CommentDialog from "./CommentDialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { HandHeart, ArrowLeft, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { getNoCacheImageUrl } from "@/lib/image-utils";
import OptimizedAvatar from "./OptimizedAvatar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ensureUserProfileExists } from "@/lib/profile-utils";
import { useToast } from "./ui/use-toast";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url?: string | null;
  };
}

interface PrayerRequestDetailProps {
  requestId: string;
  content: string;
  username: string;
  timestamp: string;
  prayerCount: number;
  isPrivate?: boolean;
  onBack: () => void;
  onPrayClick: () => void;
  hasPrayed: boolean;
  onCommentAdded?: () => void;
  onDeleteClick?: (id: string) => void;
  isOwner?: boolean;
  imageUrl?: string | null;
  avatarUrl?: string | null;
}

export default function PrayerRequestDetail({
  requestId,
  content,
  username,
  timestamp,
  prayerCount,
  isPrivate = false,
  onBack,
  onPrayClick,
  hasPrayed,
  onCommentAdded,
  onDeleteClick,
  isOwner = false,
  imageUrl,
  avatarUrl,
}: PrayerRequestDetailProps) {
  // Use useMemo to create cache-busting image URLs
  const cachedImageUrl = useMemo(() => {
    const url = getNoCacheImageUrl(imageUrl);
    console.log('PrayerRequestDetail - image URL:', { original: imageUrl, cached: url });
    return url;
  }, [imageUrl]);

  const cachedAvatarUrl = useMemo(() => {
    const url = getNoCacheImageUrl(avatarUrl);
    console.log('PrayerRequestDetail - avatar URL:', { original: avatarUrl, cached: url });
    return url;
  }, [avatarUrl]);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchComments = async () => {
    try {
      console.log("Fetching comments for request:", requestId);
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          profiles!comments_profile_id_fkey (username, avatar_url)
        `,
        )
        .eq("prayer_request_id", requestId)
        .order("created_at", { ascending: false }); // Newest comments first

      if (error) {
        console.error("Error fetching comments:", error);
        return;
      }

      console.log("Fetched comments:", data);
      setComments(data || []);
    } catch (err) {
      console.error("Exception when fetching comments:", err);
    }
  };

  useEffect(() => {
    fetchComments();

    // Subscribe to new comments - but only for inserts and updates
    const channel = supabase
      .channel(`comments-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `prayer_request_id=eq.${requestId}`,
        },
        (payload) => {
          console.log("New comment inserted:", payload);
          // Instead of refetching all comments, we can just add the new one
          // This is more efficient and prevents UI flicker
          if (payload.new) {
            // Fetch the user info for this comment
            supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", payload.new.profile_id)
              .single()
              .then(({ data: profile }) => {
                if (profile) {
                  const newComment = {
                    ...payload.new,
                    profiles: profile
                  };
                  setComments(prev => [newComment, ...prev]);
                } else {
                  // Fallback to fetching all comments if we can't get the profile
                  fetchComments();
                }
              })
              .catch(() => {
                // Fallback to fetching all comments if there's an error
                fetchComments();
              });
          } else {
            // Fallback to fetching all comments if payload.new is missing
            fetchComments();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "comments",
          filter: `prayer_request_id=eq.${requestId}`,
        },
        (payload) => {
          console.log("Comment updated:", payload);
          fetchComments();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId, fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Don't submit empty comments
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      // Start profile creation in the background but don't wait for it
      // This makes the comment submission faster
      console.log("Starting profile creation in background");
      ensureUserProfileExists(user)
        .catch(err => console.error("Error ensuring profile exists:", err));

      console.log("Submitting comment:", {
        prayer_request_id: requestId,
        content: newComment,
        user_id: user.id,
        profile_id: user.id,
      });

      const { data, error } = await supabase.from("comments").insert({
        prayer_request_id: requestId,
        content: newComment,
        user_id: user.id,
        profile_id: user.id,
      }).select();

      if (error) {
        console.error("Error posting comment:", error);
        throw error;
      }

      console.log("Comment posted successfully:", data);

      // Notify parent component to update comment count
      if (typeof onCommentAdded === 'function') {
        console.log('Calling onCommentAdded callback');
        onCommentAdded();
      } else {
        console.log('onCommentAdded callback not provided or not a function');
      }

      setNewComment("");

      // Show success message
      toast({
        title: "Success",
        description: "Comment posted successfully",
      });
    } catch (error) {
      console.error("Exception when posting comment:", error);
      toast({
        title: "Error",
        description: typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : "Failed to post comment",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold">Prayer Request</h2>
        </div>

        {isOwner && onDeleteClick && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  onDeleteClick(requestId);
                  onBack(); // Go back after deleting
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Prayer Request */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <OptimizedAvatar
            src={avatarUrl}
            alt={username}
            fallback={username.charAt(0)}
            size="md"
          />
          <div>
            <p className="font-semibold">{username}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(timestamp).toLocaleDateString()}
            </p>
          </div>
        </div>

        <p className="text-muted-foreground">{content}</p>

        {imageUrl && (
          <div className="mt-3 rounded-md overflow-hidden">
            <img
              src={cachedImageUrl || imageUrl}
              alt="Attached image"
              className="w-full max-h-80 object-cover rounded-md"
              key={cachedImageUrl || imageUrl} // Add key to force re-render when URL changes
              onError={(e) => {
                console.error('PrayerRequestDetail - Image failed to load:', imageUrl);
                // Try loading the original URL as fallback
                if (cachedImageUrl && e.currentTarget.src !== imageUrl) {
                  console.log('PrayerRequestDetail - Trying original URL as fallback');
                  e.currentTarget.src = imageUrl;
                }
              }}
              onLoad={() => console.log('PrayerRequestDetail - Image loaded successfully:', cachedImageUrl || imageUrl)}
            />
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 ${hasPrayed ? "text-primary" : "text-muted-foreground"} hover:text-primary hover:bg-primary/10`}
          onClick={onPrayClick}
        >
          <HandHeart className="h-5 w-5" />
          <span>{prayerCount}</span>
        </Button>
      </div>

      {/* Comments Section */}
      <div className="space-y-4">
        <h3 className="font-semibold">Comments</h3>

        {/* Comment List */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <OptimizedAvatar
                src={comment.profiles.avatar_url}
                alt={comment.profiles.username}
                fallback={comment.profiles.username.charAt(0)}
                size="sm"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {comment.profiles.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment Form */}
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
          />
          <Button type="submit">Post</Button>
        </form>
      </div>
    </div>
  );
}
