/**
 * Adds a cache-busting parameter to an image URL to prevent browser caching
 * @param url The original image URL
 * @returns The URL with a cache-busting parameter
 */
export function getNoCacheImageUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    // Make sure the URL is valid
    new URL(url);

    // Add a timestamp parameter to prevent caching
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  } catch (error) {
    console.error('Invalid URL in getNoCacheImageUrl:', url, error);
    return url; // Return the original URL if it's invalid
  }
}

/**
 * Attempts to clear the browser cache for a specific image URL
 * @param url The image URL to clear from cache
 */
export function clearImageFromCache(url: string | null): void {
  if (!url) return;

  try {
    // Create a new image element and set its src to the URL with cache-busting
    const img = new Image();
    img.src = getNoCacheImageUrl(url) || '';

    // Force a reload of the image
    if ('caches' in window) {
      // If the Cache API is available, try to delete the cache entry
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.open(cacheName).then(cache => {
            cache.delete(url).then(() => {
              console.log(`Deleted ${url} from cache ${cacheName}`);
            });
          });
        });
      });
    }
  } catch (error) {
    console.error('Error clearing image from cache:', error);
  }
}

/**
 * Preloads an image to improve loading performance
 * @param url The image URL to preload
 * @returns A promise that resolves when the image is loaded or rejects on error
 */
export function preloadImage(url: string | null): Promise<void> {
  if (!url) return Promise.reject(new Error('No URL provided'));

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
    img.src = url;
  });
}

/**
 * Gets a fallback avatar URL using DiceBear API
 * @param seed A seed string (usually username or user ID)
 * @returns A URL to a generated avatar
 */
export function getFallbackAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}
