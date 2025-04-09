/**
 * Adds a cache-busting parameter to an image URL to prevent browser caching
 * @param url The original image URL
 * @returns The URL with a cache-busting parameter
 */
export function getNoCacheImageUrl(url: string | null): string | null {
  if (!url) return null;

  // Add a timestamp parameter to prevent caching
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
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
