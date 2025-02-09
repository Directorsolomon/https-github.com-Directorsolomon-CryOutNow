import { AuthProvider } from "@/lib/auth";
import PrayerRequestForm from "./PrayerRequestForm";

export default function PrayerRequestFormStory() {
  return (
    <AuthProvider>
      <div className="p-4 bg-background">
        <PrayerRequestForm
          onSubmit={(data) => {
            console.log("Form submitted:", data);
          }}
        />
      </div>
    </AuthProvider>
  );
}
