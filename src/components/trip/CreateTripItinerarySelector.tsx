"use client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ITINERARY_TYPES } from "@/lib/constants";
import ItinerarySelectionStep from "./ItinerarySelectionStep";
import type { Itinerary, ItineraryType } from "@/lib/types";

export default function CreateTripItinerarySelector({ itineraries }: { itineraries: Itinerary[] }) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<ItineraryType | null>(null);

  const filteredItineraries = useMemo(() => {
    return itineraries.filter(itn => {
      const matchesType = selectedType ? itn.type === selectedType : true;
      const matchesSearch =
        itn.name.toLowerCase().includes(search.toLowerCase()) ||
        (itn.description && itn.description.toLowerCase().includes(search.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [itineraries, search, selectedType]);

  return (
    <div>
      <div className="max-w-lg mx-auto mb-6">
        <Input
          type="text"
          placeholder="按名称或描述搜索行程..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-4 text-base shadow-sm"
        />
      </div>
      <div className="flex gap-3 justify-center mb-8">
        <Button
          key="all"
          variant={selectedType === null ? "default" : "outline"}
          onClick={() => setSelectedType(null)}
          className={selectedType === null ? "bg-primary text-white" : ""}
        >
          所有类型
        </Button>
        {Object.entries(ITINERARY_TYPES).map(([key, label]) => (
          <Button
            key={key}
            variant={selectedType === key ? "default" : "outline"}
            onClick={() => setSelectedType(selectedType === key ? null : key as ItineraryType)}
            className={selectedType === key ? "bg-primary text-white" : ""}
          >
            {label}
          </Button>
        ))}
      </div>
      <ItinerarySelectionStep itineraries={filteredItineraries} />
    </div>
  );
} 