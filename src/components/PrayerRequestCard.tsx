import React, { useMemo } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { HandHeart, MessageCircle, Share2, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { getNoCacheImageUrl } from "@/lib/image-utils";
import OptimizedAvatar from "./OptimizedAvatar";

interface PrayerRequestCardProps {
  id?: string;
  content: string;
  timestamp?: string;
  prayerCount?: number;
  commentCount?: number;
  isPrivate?: boolean;
  onPrayClick?: () => void;
  onCommentClick?: () => void;
  onDeleteClick?: (id: string) => void;
  username?: string;
  hasPrayed?: boolean;
  imageUrl?: string | null;
  avatarUrl?: string | null;
  isOwner?: boolean;
}

const PrayerRequestCard = ({
  id,
  content,
  timestamp = new Date().toISOString(),
  prayerCount = 0,
  commentCount = 0,
  isPrivate = false,
  onPrayClick = () => { },
  onCommentClick = () => { },
  onDeleteClick = () => { },
  username = "Anonymous",
  hasPrayed = false,
  imageUrl = null,
  avatarUrl = null,
  isOwner = false,
}: PrayerRequestCardProps) => {
  // Use useMemo to create a cache-busting image URL
  const cachedImageUrl = useMemo(() => {
    const url = getNoCacheImageUrl(imageUrl);
    console.log('Prayer request image URL:', { original: imageUrl, cached: url });
    return url;
  }, [imageUrl]);

  const cachedAvatarUrl = useMemo(() => {
    const url = getNoCacheImageUrl(avatarUrl);
    console.log('Avatar image URL:', { original: avatarUrl, cached: url });
    return url;
  }, [avatarUrl]);

  return (
    <div className="space-y-3 bg-background p-4 rounded-lg border">
      {/* User Info */}
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

      {/* Content */}
      <div>
        <p className="text-muted-foreground mt-1">{content}</p>
        {imageUrl && (
          <div className="mt-3 rounded-md overflow-hidden">
            <img
              src={cachedImageUrl || imageUrl}
              alt="Attached image"
              className="w-full max-h-64 object-cover rounded-md"
              key={cachedImageUrl || imageUrl} // Add key to force re-render when URL changes
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                // Try loading the original URL as fallback
                if (cachedImageUrl && e.currentTarget.src !== imageUrl) {
                  console.log('Trying original URL as fallback');
                  e.currentTarget.src = imageUrl;
                }
              }}
              onLoad={() => console.log('Image loaded successfully:', cachedImageUrl || imageUrl)}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4">
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

        {isOwner && id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDeleteClick(id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default PrayerRequestCard;
