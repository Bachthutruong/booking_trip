'use server';

import { itinerariesDB } from '@/lib/data';
import type { Itinerary } from '@/lib/types';

export async function getItineraries(): Promise<Itinerary[]> {
  // In a real app, this would fetch from a database
  // Add a small delay to simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));
  return JSON.parse(JSON.stringify(itinerariesDB)); // Simulate immutability and serialization
}

export async function getItineraryById(id: string): Promise<Itinerary | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const itinerary = itinerariesDB.find(itn => itn.id === id);
  return itinerary ? JSON.parse(JSON.stringify(itinerary)) : null;
}
