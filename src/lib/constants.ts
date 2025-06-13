
import type { ItineraryType, TripStatus } from './types';

export const ITINERARY_TYPES: Record<ItineraryType, string> = {
  airport_dropoff: '台南到機場',
  airport_pickup: '機場回台南',
  tourism: '旅遊共乘',
};

export const TRIP_STATUSES: Record<TripStatus, string> = {
  pending_payment: '待付款',
  payment_confirmed: '已付款',
  completed: '已完成',
  cancelled: '已取消',
};

export const AVAILABLE_SECONDARY_CONTACT_TYPES = ['Email', 'Zalo', 'WeChat', 'Line', 'WhatsApp', 'Other'];

// This is kept for fallback if itinerary-specific times are not available, but should be deprecated.
export const MOCK_AVAILABLE_TIMES = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
