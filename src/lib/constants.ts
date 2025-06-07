import type { ItineraryType, TripStatus } from './types';

export const ITINERARY_TYPES: Record<ItineraryType, string> = {
  airport_pickup: 'Airport Pickup (To Hanoi)',
  airport_dropoff: 'Airport Dropoff (From Hanoi)',
  tourism: 'Hanoi Tourism Package',
};

export const TRIP_STATUSES: Record<TripStatus, string> = {
  pending_payment: 'Pending Payment',
  payment_confirmed: 'Payment Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const AVAILABLE_SECONDARY_CONTACT_TYPES = ['Email', 'Zalo', 'WeChat', 'Line', 'WhatsApp', 'Other'];

export const MOCK_AVAILABLE_TIMES = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
