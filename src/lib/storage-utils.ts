import { supabase } from "./supabase";

/**
 * Ensures a storage bucket exists, creating it if necessary
 * @param bucketName The name of the bucket to check/create
 * @param options Options for bucket creation (default: { public: true })
 * @returns Promise<boolean> True if the bucket exists or was created successfully
 */
export async function ensureStorageBucketExists(
  bucketName: string,
  options: { public: boolean } = { public: true }
): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);

    if (error && error.message.includes("not found")) {
      await supabase.storage.createBucket(bucketName, options);
    }
    return true;
  } catch (error) {
    console.error(`Error checking/creating bucket ${bucketName}:`, error);
    return false;
  }
}

/**
 * Uploads a file to Supabase storage
 * @param file The file to upload
 * @param bucketName The storage bucket name
 * @param userId The user ID to include in the file path
 * @param prefix Optional prefix for the filename
 * @returns Promise with the public URL of the uploaded file or null if failed
 */
export async function uploadFile(
  file: File,
  bucketName: string,
  userId: string,
  prefix: string = ""
): Promise<string | null> {
  try {
    // Ensure bucket exists
    const bucketExists = await ensureStorageBucketExists(bucketName);
    if (!bucketExists) {
      throw new Error(`Failed to create storage bucket: ${bucketName}`);
    }

    // Generate file path
    const fileExt = file.name.split(".").pop();
    const fileName = prefix ? `${prefix}-${Date.now()}.${fileExt}` : `file-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!data || !data.publicUrl) {
      throw new Error("Failed to get public URL for uploaded file");
    }

    return data.publicUrl;
  } catch (error) {
    console.error(`Error uploading file to ${bucketName}:`, error);
    return null;
  }
}
