import React, { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { getNoCacheImageUrl, getFallbackAvatarUrl } from "@/lib/image-utils";
import { imageCache } from "@/lib/image-cache";

interface OptimizedAvatarProps {
  src: string | null;
  alt: string;
  fallback: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const OptimizedAvatar: React.FC<OptimizedAvatarProps> = ({
  src,
  alt,
  fallback,
  className = "",
  size = "md",
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState<string | null>(null);

  // Size classes
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  // Preload the image
  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      setError(true);
      return;
    }

    // Reset states when src changes
    setIsLoading(true);
    setError(false);

    const loadImage = async () => {
      try {
        // Check if the image is already preloaded in the cache
        if (imageCache.isPreloaded(src)) {
          console.log('Image already preloaded, showing immediately:', src);
          setOptimizedSrc(src);
          setIsLoading(false);
          return;
        }

        // Create optimized URL with cache busting
        const cachedUrl = getNoCacheImageUrl(src);
        setOptimizedSrc(cachedUrl);

        // Try to preload the image
        try {
          await imageCache.preloadImage(cachedUrl || src);
          setIsLoading(false);
        } catch (error) {
          // Image failed to load, try fallback
          if (alt) {
            const fallbackUrl = getFallbackAvatarUrl(alt);
            console.log(`Using fallback avatar for ${alt}:`, fallbackUrl);
            setOptimizedSrc(fallbackUrl);

            try {
              await imageCache.preloadImage(fallbackUrl);
              setIsLoading(false);
              setError(false); // We have a fallback, so no error
            } catch (fallbackError) {
              setIsLoading(false);
              setError(true);
              console.error(`Failed to load fallback avatar image for ${alt}`);
            }
          } else {
            setIsLoading(false);
            setError(true);
            console.error(`Failed to load avatar image: ${src}`);
          }
        }
      } catch (error) {
        console.error('Error in avatar loading process:', error);
        setIsLoading(false);
        setError(true);
      }
    };

    loadImage();
  }, [src, alt]);

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {!error && optimizedSrc && (
        <AvatarImage
          src={optimizedSrc}
          alt={alt}
          className={isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-300"}
        />
      )}
      <AvatarFallback
        className={`bg-primary/10 ${!isLoading && !error ? "opacity-0" : "opacity-100"}`}
        delayMs={0}
      >
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
};

export default OptimizedAvatar;
