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
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
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
  onDeleteClick,
  isOwner = false,
  imageUrl,
  avatarUrl,
}: PrayerRequestDetailProps) {
  // Use useMemo to create cache-busting image URLs
  const cachedImageUrl = useMemo(() => getNoCacheImageUrl(imageUrl), [imageUrl]);
  const cachedAvatarUrl = useMemo(() => getNoCacheImageUrl(avatarUrl), [avatarUrl]);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(
        `
        *,
        profiles!comments_profile_id_fkey (username, avatar_url)
      `,
      )
      .eq("prayer_request_id", requestId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return;
    }

    setComments(data || []);
  };

  useEffect(() => {
    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `prayer_request_id=eq.${requestId}`,
        },
        () => fetchComments(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from("comments").insert({
        prayer_request_id: requestId,
        content: newComment,
        user_id: user.id,
        profile_id: user.id,
      });

      if (error) throw error;

      // Notify parent component to update comment count
      onCommentAdded?.();
      setNewComment("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
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
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {cachedAvatarUrl ? (
              <img
                src={cachedAvatarUrl}
                alt={username}
                className="h-full w-full object-cover"
                key={cachedAvatarUrl} // Add key to force re-render when URL changes
              />
            ) : (
              username.charAt(0)
            )}
          </div>
          <div>
            <p className="font-semibold">{username}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(timestamp).toLocaleDateString()}
            </p>
          </div>
        </div>

        <p className="text-muted-foreground">{content}</p>

        {cachedImageUrl && (
          <div className="mt-3 rounded-md overflow-hidden">
            <img
              src={cachedImageUrl}
              alt="Attached image"
              className="w-full max-h-80 object-cover rounded-md"
              key={cachedImageUrl} // Add key to force re-render when URL changes
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
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm overflow-hidden">
                {comment.profiles.avatar_url ? (
                  <img
                    src={comment.profiles.avatar_url}
                    alt={comment.profiles.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  comment.profiles.username.charAt(0)
                )}
              </div>
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
