
import type { ObjectId } from 'mongodb';

export type ItineraryType = 'airport_pickup' | 'airport_dropoff' | 'tourism';

export interface Itinerary {
  _id?: ObjectId; // MongoDB ID
  id: string; // User-friendly/app-specific ID, can be same as _id.toString() or custom
  name: string;
  type: ItineraryType;
  pricePerPerson: number;
  description: string;
  imageUrl?: string;
  availableTimes: string[];
}

export interface Participant {
  id: string; // Can be a generated UUID or similar
  name: string;
  phone: string;
  numberOfPeople: number;
  address: string;
  discountCode?: string;
  notes?: string;
  pricePaid: number; // Price this participant is responsible for
}

export type TripStatus = 'pending_payment' | 'payment_confirmed' | 'completed' | 'cancelled';

export interface Trip {
  _id?: ObjectId; // MongoDB ID
  id: string; // User-friendly/app-specific ID
  itineraryId: string;
  itineraryName: string;
  itineraryType: ItineraryType;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  numberOfPeople: number;
  pickupAddress?: string;
  dropoffAddress?: string;
  contactName: string;
  contactPhone: string;
  secondaryContact?: string;
  notes?: string;
  transferProofImageUrl?: string;
  status: TripStatus;
  creatorUserId?: string; // e.g., contactPhone of the creator
  participants: Participant[];
  totalPrice: number; // Total price for the initial booking by the creator
  district?: string;
  additionalServiceIds: string[];
  createdAt: string; // ISO date string
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  isActive: boolean;
  description?: string;
}

export interface DistrictSurcharge {
  id: string;
  districtName: string;
  surchargeAmount: number;
}

export interface AdditionalService {
  id: string;
  name: string;
  price: number;
  applicableTo: ItineraryType[];
  iconName?: string;
}

export interface Feedback {
  _id?: ObjectId; // MongoDB ID
  id: string; // User-friendly/app-specific ID
  tripId?: string;
  name: string;
  email: string;
  message: string;
  submittedAt: string; // ISO date string
}

// Form specific types
export interface CreateTripFormValues {
  itineraryId: string;
  date: Date;
  time: string;
  numberOfPeople: number;
  pickupAddress?: string;
  dropoffAddress?: string;
  contactName: string;
  contactPhone: string;
  secondaryContact?: string;
  notes?: string;
  district?: string;
  additionalServiceIds: string[];
}

export interface JoinTripFormValues {
  tripId: string;
  name: string;
  phone: string;
  numberOfPeople: number;
  address: string;
  discountCode?: string;
  notes?: string;
}

export interface FeedbackFormValues {
  name: string;
  email: string;
  tripId?: string;
  message: string;
}

// Admin form for Itinerary
export interface ItineraryFormValues {
  name: string;
  type: ItineraryType;
  pricePerPerson: number;
  description: string;
  imageUrl?: string;
  availableTimes: string; // Comma-separated string, will be parsed
}
