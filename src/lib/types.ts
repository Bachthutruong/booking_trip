export type ItineraryType = 'airport_pickup' | 'airport_dropoff' | 'tourism';

export interface Itinerary {
  id: string;
  name: string;
  type: ItineraryType;
  pricePerPerson: number;
  description: string;
  imageUrl?: string; // Optional image for the itinerary
  availableTimes: string[]; // e.g., ['08:00', '10:00']
}

export interface Participant {
  id: string;
  name: string;
  phone: string;
  numberOfPeople: number;
  address: string; // For tourism, their pickup. For airport, could be for record.
  discountCode?: string;
  notes?: string;
  pricePaid: number;
}

export type TripStatus = 'pending_payment' | 'payment_confirmed' | 'completed' | 'cancelled';

export interface Trip {
  id: string;
  itineraryId: string;
  itineraryName: string; // Denormalized
  itineraryType: ItineraryType; // Denormalized
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  numberOfPeople: number;
  pickupAddress?: string; // For airport_dropoff, tourism
  dropoffAddress?: string; // For airport_pickup
  contactName: string;
  contactPhone: string;
  secondaryContact?: string; // Email, Zalo, etc.
  notes?: string;
  transferProofImageUrl?: string;
  status: TripStatus;
  creatorUserId?: string; // Could be phone number of creator
  participants: Participant[];
  totalPrice: number;
  district?: string;
  additionalServiceIds: string[]; // IDs of selected AdditionalService
  createdAt: string; // ISO date string
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'fixed' | 'percentage';
  value: number; // Amount for fixed, percentage (e.g., 10 for 10%) for percentage
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
  applicableTo: ItineraryType[]; // Which itinerary types this service applies to
  iconName?: string; // Lucide icon name
}

export interface Feedback {
  id: string;
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
