"use client";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ITINERARY_TYPES } from "@/lib/constants";
import ItinerarySelectionStep from "./ItinerarySelectionStep";
import type { Itinerary, ItineraryType } from "@/lib/types";

export default function CreateTripItinerarySelector({ itineraries }: { itineraries: Itinerary[] }) {
  const itineraryTypeKeys = Object.keys(ITINERARY_TYPES) as ItineraryType[];
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<ItineraryType>(itineraryTypeKeys[0]);

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
      <div className="flex flex-col md:flex-row gap-2 md:gap-3 justify-center mb-8">
        {Object.entries(ITINERARY_TYPES).map(([key, label]) => (
          <Button
            key={key}
            variant={selectedType === key ? "default" : "outline"}
            onClick={() => setSelectedType(selectedType === key ? itineraryTypeKeys[0] : key as ItineraryType)}
            className={`w-full md:w-auto ${selectedType === key ? "bg-primary text-white" : ""}`}
          >
            {label}
          </Button>
        ))}
      </div>
      <ItinerarySelectionStep itineraries={filteredItineraries} />
    </div>
  );
} 