/**
 * A simple in-memory cache for images to improve loading performance
 */
class ImageCache {
  private cache: Map<string, string> = new Map();
  private preloadedImages: Map<string, HTMLImageElement> = new Map();

  /**
   * Store an image URL in the cache
   * @param key The cache key (usually the user ID or a unique identifier)
   * @param url The image URL to cache
   */
  set(key: string, url: string): void {
    this.cache.set(key, url);
  }

  /**
   * Get an image URL from the cache
   * @param key The cache key
   * @returns The cached URL or null if not found
   */
  get(key: string): string | null {
    return this.cache.get(key) || null;
  }

  /**
   * Check if an image URL is in the cache
   * @param key The cache key
   * @returns True if the image URL is cached
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Preload an image and store it in the preloaded images cache
   * Uses a timeout to prevent hanging on slow connections
   * @param url The image URL to preload
   * @returns A promise that resolves when the image is loaded or times out
   */
  preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already preloaded
      if (this.preloadedImages.has(url)) {
        resolve();
        return;
      }

      // Set a timeout to prevent hanging on slow connections
      const timeoutId = setTimeout(() => {
        console.warn(`Image preload timed out for: ${url}`);
        resolve(); // Resolve anyway to prevent blocking
      }, 3000); // 3 second timeout

      const img = new Image();
      img.onload = () => {
        clearTimeout(timeoutId);
        this.preloadedImages.set(url, img);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timeoutId);
        console.error(`Failed to preload image: ${url}`);
        resolve(); // Resolve anyway to prevent blocking
      };

      // Add cache-busting parameter to prevent caching issues
      const cacheBuster = `?t=${Date.now()}`;
      img.src = url.includes('?') ? `${url}&_cb=${Date.now()}` : `${url}${cacheBuster}`;
    });
  }

  /**
   * Check if an image is preloaded
   * @param url The image URL
   * @returns True if the image is preloaded
   */
  isPreloaded(url: string): boolean {
    return this.preloadedImages.has(url);
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.preloadedImages.clear();
  }
}

// Export a singleton instance
export const imageCache = new ImageCache();
