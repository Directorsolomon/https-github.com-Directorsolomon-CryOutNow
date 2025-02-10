import React from "react";
import { useAuth } from "@/lib/auth";
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
import { ImageIcon } from "lucide-react";
import { Switch } from "./ui/switch";

const formSchema = z.object({
  description: z.string().min(1, "Prayer request cannot be empty"),
  isPublic: z.boolean().default(true),
});

type PrayerRequestFormProps = {
  onSubmit?: (data: z.infer<typeof formSchema>) => void;
};

const PrayerRequestForm = ({
  onSubmit = (data) => console.log("Form submitted:", data),
}: PrayerRequestFormProps = {}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      isPublic: true,
    },
  });

  const { user = null } = useAuth() || {};

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (!user) {
        console.error("Must be logged in to submit a prayer request");
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
      });

      if (error) throw error;
      onSubmit(data);
      form.reset();
    } catch (error) {
      console.error("Error submitting prayer request:", error);
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

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-primary hover:text-primary/90"
                onClick={() => {
                  // TODO: Implement image upload
                  console.log("Image upload clicked");
                }}
              >
                <ImageIcon className="h-5 w-5" />
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

export default PrayerRequestForm;
