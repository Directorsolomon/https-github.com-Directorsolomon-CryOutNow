import React, { useState } from "react";
import { Input } from "./ui/input";
import { AuthProvider } from "@/lib/auth";
import PrayerRequestCard from "./PrayerRequestCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search, Filter } from "lucide-react";

interface PrayerRequest {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  timestamp?: string;
  prayerCount?: number;
  isPrivate?: boolean;
}

interface PrayerRequestGridProps {
  requests?: PrayerRequest[];
  onSearch?: (query: string) => void;
  onFilter?: (category: string) => void;
}

const defaultRequests: PrayerRequest[] = [
  {
    id: "1",
    title: "Family Health",
    description: "Please pray for my family's health and well-being.",
    category: "Health",
    timestamp: "2024-03-20T10:00:00Z",
    prayerCount: 5,
    isPrivate: false,
  },
  {
    id: "2",
    title: "New Job Opportunity",
    description: "Seeking prayers for guidance in my career path.",
    category: "Work",
    timestamp: "2024-03-19T15:30:00Z",
    prayerCount: 3,
    isPrivate: false,
  },
  {
    id: "3",
    title: "Personal Growth",
    description: "Prayers for wisdom and spiritual growth.",
    category: "Spiritual",
    timestamp: "2024-03-18T09:15:00Z",
    prayerCount: 7,
    isPrivate: false,
  },
];

const PrayerRequestGridInner = ({
  requests = defaultRequests,
  onSearch = () => {},
  onFilter = () => {},
}: PrayerRequestGridProps = {}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilter = (value: string) => {
    setSelectedCategory(value);
    onFilter(value);
  };

  return (
    <div className="w-full min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search prayer requests..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={selectedCategory} onValueChange={handleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Family">Family</SelectItem>
                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="Spiritual">Spiritual</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Prayer Request Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(requests || []).map((request) => (
            <PrayerRequestCard
              key={request.id}
              content={request.description || ""}
              timestamp={request.timestamp}
              prayerCount={request.prayerCount}
              isPrivate={request.isPrivate}
            />
          ))}
        </div>

        {/* Empty State */}
        {(!requests || requests.length === 0) && (
          <div className="text-center py-12">
            <Filter className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              No prayer requests found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const PrayerRequestGrid = (props: PrayerRequestGridProps = {}) => {
  return <PrayerRequestGridInner {...props} />;
};

export default PrayerRequestGrid;
