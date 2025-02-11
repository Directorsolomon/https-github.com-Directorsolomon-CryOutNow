import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "./ui/use-toast";

interface CommentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  requestUserId: string;
  username: string;
}

export default function CommentDialog({
  isOpen,
  onClose,
  requestId,
  requestUserId,
  username,
}: CommentDialogProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim()) return;

    setIsSubmitting(true);
    try {
      // Add comment
      const { error: commentError } = await supabase.from("comments").insert({
        prayer_request_id: requestId,
        user_id: user.id,
        content: comment.trim(),
      });

      if (commentError) throw commentError;

      // Send notification
      await supabase.from("notifications").insert({
        user_id: requestUserId,
        type: "comment",
        content: `${username || "Someone"} commented on your prayer request`,
        related_id: requestId,
      });

      toast({
        title: "Comment Added",
        description: "Your comment has been posted successfully.",
      });

      setComment("");
      onClose();
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Comment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Write your comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
