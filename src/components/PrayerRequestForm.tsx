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
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  isPublic: z.boolean().default(true),
});

type PrayerRequestFormProps = {
  onSubmit?: (data: z.infer<typeof formSchema>) => void;
};

const categories = [
  { value: "health", label: "Health" },
  { value: "family", label: "Family" },
  { value: "work", label: "Work" },
  { value: "spiritual", label: "Spiritual" },
  { value: "other", label: "Other" },
];

const PrayerRequestForm = ({
  onSubmit = (data) => console.log("Form submitted:", data),
}: PrayerRequestFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "health",
      isPublic: true,
    },
  });

  const { user } = useAuth();

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (!user)
        throw new Error("Must be logged in to submit a prayer request");

      const { error } = await supabase.from("prayer_requests").insert({
        title: data.title,
        description: data.description,
        category: data.category,
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
    <div className="w-full max-w-[600px] bg-background p-6">
      <h2 className="text-2xl font-semibold mb-6">Submit Prayer Request</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter prayer request title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your prayer request"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          <Button type="submit" className="w-full">
            Submit Prayer Request
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default PrayerRequestForm;
