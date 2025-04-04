import React from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { HandHeart, MessageCircle, Share2 } from "lucide-react";

interface PrayerRequestCardProps {
  content: string;
  timestamp?: string;
  prayerCount?: number;
  commentCount?: number;
  isPrivate?: boolean;
  onPrayClick?: () => void;
  onCommentClick?: () => void;
  username?: string;
  hasPrayed?: boolean;
  imageUrl?: string | null;
  avatarUrl?: string | null;
}

const PrayerRequestCard = ({
  content,
  timestamp = new Date().toISOString(),
  prayerCount = 0,
  commentCount = 0,
  isPrivate = false,
  onPrayClick = () => {},
  onCommentClick = () => {},
  username = "Anonymous",
  hasPrayed = false,
  imageUrl = null,
  avatarUrl = null,
}: PrayerRequestCardProps) => {
  return (
    <div className="space-y-3 bg-background p-4 rounded-lg border">
      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="h-full w-full object-cover"
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

      {/* Content */}
      <div>
        <p className="text-muted-foreground mt-1">{content}</p>
        {imageUrl && (
          <div className="mt-3 rounded-md overflow-hidden">
            <img
              src={imageUrl}
              alt="Attached image"
              className="w-full max-h-64 object-cover rounded-md"
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-6 pt-2">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 ${hasPrayed ? "text-primary" : "text-muted-foreground"} hover:text-primary hover:bg-primary/10`}
          onClick={onPrayClick}
          title="Pray for this request"
        >
          <HandHeart className="h-5 w-5" />
          <span>{prayerCount}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
          onClick={onCommentClick}
          title="View comments"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{commentCount}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
          title="Share"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PrayerRequestCard;
