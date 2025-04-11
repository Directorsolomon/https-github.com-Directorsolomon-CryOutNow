import React, { useState, useRef } from "react";
import { useAuth, AuthProvider } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Textarea } from "./ui/textarea";
import { ImageIcon, X } from "lucide-react";
import { Switch } from "./ui/switch";
import { useToast } from "./ui/use-toast";

const formSchema = z.object({
  description: z.string().min(1, "Prayer request cannot be empty"),
  isPublic: z.boolean().default(true),
  imageUrl: z.string().optional(),
});

type PrayerRequestFormProps = {
  onSubmit?: (data: z.infer<typeof formSchema>) => void;
};

const PrayerRequestFormInner = ({
  onSubmit = (data) => console.log("Form submitted:", data),
}: PrayerRequestFormProps = {}) => {
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      isPublic: true,
      imageUrl: "",
    },
  });

  const { user = null } = useAuth() || {};

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !user) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/prayer-${Date.now()}.${fileExt}`;

      setUploading(true);

      // Create a preview
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);

      // Create the bucket if it doesn't exist
      const { data: bucketData, error: bucketError } =
        await supabase.storage.getBucket("prayer-images");

      if (bucketError && bucketError.message.includes("not found")) {
        await supabase.storage.createBucket("prayer-images", { public: true });
      }

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("prayer-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage
        .from("prayer-images")
        .getPublicUrl(filePath);

      console.log('Uploaded image public URL:', data.publicUrl);

      // Set the image URL in the form
      form.setValue("imageUrl", data.publicUrl);

      // Verify the image is accessible
      const img = new Image();
      img.onload = () => console.log('Image verified as accessible:', data.publicUrl);
      img.onerror = () => console.error('Image not accessible after upload:', data.publicUrl);
      img.src = data.publicUrl;

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      setImagePreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue("imageUrl", "");
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (!user) {
        console.error("Must be logged in to submit a prayer request");
        toast({
          title: "Error",
          description: "You must be logged in to submit a prayer request",
          variant: "destructive",
        });
        return;
      }

      // First ensure profile exists
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: user.user_metadata.full_name || "Anonymous",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        username: user.email?.split("@")[0] || "user",
        avatar_url: null,
      });

      if (profileError) {
        console.error("Profile error:", profileError);
        throw new Error("Failed to verify user profile");
      }

      const { error } = await supabase.from("prayer_requests").insert({
        content: data.description,
        is_public: data.isPublic,
        user_id: user.id,
        image_url: data.imageUrl || null,
      });

      if (error) throw error;

      // Show success toast
      toast({
        title: "Success",
        description: "Prayer request submitted successfully",
      });

      onSubmit(data);
      form.reset();
      setImagePreview(null);
    } catch (error) {
      console.error("Error submitting prayer request:", error);
      toast({
        title: "Error",
        description: "Failed to submit prayer request",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full bg-background p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Share your prayer request..."
                    className="min-h-[100px] border-none focus-visible:ring-0 px-0 text-lg resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Public Request</FormLabel>
                  <div className="text-sm text-gray-500">
                    Make this prayer request visible to others
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative mt-2 rounded-md overflow-hidden">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-48 object-cover rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 rounded-full"
                onClick={removeImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-primary hover:text-primary/90"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )}
              </Button>
            </div>
            <Button type="submit" className="rounded-full px-6">
              Post
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PrayerRequestFormInner;
