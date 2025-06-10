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
  availableTimes: string[]; // Array of HH:MM strings
}

export interface Participant {
  id: string; // Can be a generated UUID or similar
  name: string;
  phone: string;
  numberOfPeople: number;
  address: string; // Their pickup/dropoff address for this leg of the shared trip
  email?: string; // New field
  dob?: string; // New field (Date of Birth)
  identityNumber?: string; // New field (e.g., ID card, passport number)
  additionalServiceIds?: string[]; // Keep IDs for storage
  additionalServices?: AdditionalService[]; // New field for populated service objects
  discountCodeString?: string; // Keep string for storage
  discountCode?: DiscountCode; // New field for populated discount code object
  notes?: string;
  pricePaid: number; // Price this participant is responsible for (can be 0 if main booker covers)
  district?: string; // Participant's pickup/dropoff district for surcharge calculation
  status: TripStatus; // If individual payment tracking is needed
  transferProofImageUrl?: string; // Individual participant's payment proof
  confirmedBy?: string; // admin username hoặc id
  confirmedAt?: string; // ISO date string
}

export type TripStatus = 'pending_payment' | 'payment_confirmed' | 'completed' | 'cancelled';

export interface Trip {
  _id?: ObjectId; // MongoDB ID
  id: string; // User-friendly/app-specific ID
  itineraryId: string; // Refers to Itinerary.id
  itineraryName: string;
  itineraryType: ItineraryType;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  numberOfPeople: number; // Initial number of people by creator
  pickupAddress?: string;
  dropoffAddress?: string;
  contactName: string;
  contactPhone: string;
  secondaryContact?: string; // Format "Type: Value", e.g., "Email: test@example.com"
  notes?: string;
  status: TripStatus;
  creatorUserId?: string; // e.g., contactPhone of the creator, or a dedicated user ID if auth is added
  participants: Participant[];
  totalPrice: number; // Total price for the initial booking by the creator
  district?: string; // Selected district for surcharge calculation
  additionalServiceIds: string[]; // IDs of selected AdditionalService
  discountCode?: string; // Applied discount code
  createdAt: string; // ISO date string
  // updatedAd: string; // ISO date string
  overallStatus: TripStatus; // Add overallStatus to Trip interface
  additionalServices?: AdditionalService[]; // Add populated services to Trip interface
  isDeleted?: boolean; // Soft-delete flag
  deletedAt?: string; // ISO date string
  deletedBy?: string; // Admin user id or username
  handoverComment?: string; // Staff handover notes/comments
}

export interface DiscountCode {
  _id?: ObjectId;
  id: string;
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  discountPercentage?: number;
  isActive: boolean;
  description?: string;
  usageLimit?: number;
  usedCount?: number;
  validFrom?: string; // ISO date string
  validTo?: string; // ISO date string
  expiryDate?: string; // ISO date string
}

export interface DistrictSurcharge {
  _id?: ObjectId;
  id: string;
  districtName: string;
  surchargeAmount: number;
}

export interface AdditionalService {
  _id?: ObjectId;
  id: string;
  name: string;
  price: number;
  description?: string;
  applicableTo: ItineraryType[]; // Which itinerary types this service can be applied to
  iconName?: string; // Optional: for UI, e.g., 'Luggage', 'Baby'
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

// Admin User type
export interface AdminUser {
  _id: ObjectId;
  id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'staff'; // Add role field
  createdAt: Date;
  updatedAt: Date;
}


// Form specific types
export interface CreateTripFormValues {
  itineraryId: string;
  date: Date; // Date object from calendar
  time: string;
  numberOfPeople: number;
  pickupAddress?: string;
  dropoffAddress?: string;
  contactName: string;
  contactPhone: string;
  secondaryContactType?: string; // e.g., 'Email', 'Zalo'
  secondaryContactValue?: string; // The actual email, Zalo number etc.
  notes?: string;
  district?: string;
  additionalServiceIds: string[];
  discountCode?: string;
}

export interface JoinTripFormValues {
  tripId: string;
  name: string;
  phone: string;
  numberOfPeople: number;
  address: string; // Their pickup address for this shared trip
  discountCode?: string;
  notes?: string;
  district?: string; // Add district field to JoinTripFormValues
  pricePaid: number; // Add pricePaid field to JoinTripFormValues
  additionalServiceIds?: string[]; // Add additionalServiceIds to JoinTripFormValues
}

export interface FeedbackFormValues {
  name: string;
  email: string;
  tripId?: string;
  message: string;
}

export interface ItineraryFormValues {
  name: string;
  type: ItineraryType;
  pricePerPerson: number;
  description: string;
  imageUrl?: string;
  availableTimes: string; // Comma-separated string, will be parsed
}

// Admin form types
export interface DiscountCodeFormValues {
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  discountPercentage?: number;
  isActive: boolean;
  description?: string;
  usageLimit?: number | '';
  expiryDate?: string | null;
}

export interface DistrictSurchargeFormValues {
  districtName: string;
  surchargeAmount: number;
}

export interface AdditionalServiceFormValues {
  name: string;
  price: number;
  description?: string;
  applicableTo: ItineraryType[];
  iconName?: string;
}

export interface TermsContent {
  _id?: ObjectId;
  key: string; // e.g., 'booking_terms'
  content: string; // HTML hoặc markdown
  updatedAt: string; // ISO date string
}
