import type { Itinerary, DiscountCode, DistrictSurcharge, AdditionalService, Trip } from './types';
import { MOCK_AVAILABLE_TIMES } from './constants';

export const availableTimes: string[] = MOCK_AVAILABLE_TIMES;

export let itinerariesDB: Itinerary[] = [
  {
    id: 'itn_1',
    name: 'Noi Bai Airport Pickup to City Center',
    type: 'airport_pickup',
    pricePerPerson: 350000, // VND
    description: 'Comfortable and reliable pickup service from Noi Bai International Airport to your hotel or address in Hanoi city center. Price is per person for a shared vehicle, or base price for private car up to 3 people.',
    imageUrl: 'https://placehold.co/600x400.png', // Replace with actual or relevant placeholder
    availableTimes,
  },
  {
    id: 'itn_2',
    name: 'City Center to Noi Bai Airport Dropoff',
    type: 'airport_dropoff',
    pricePerPerson: 300000, // VND
    description: 'Convenient dropoff service from your location in Hanoi city center to Noi Bai International Airport. Ensure you arrive on time for your flight.',
    imageUrl: 'https://placehold.co/600x400.png', // Replace with actual or relevant placeholder
    availableTimes,
  },
  {
    id: 'itn_3',
    name: 'Hanoi Old Quarter Walking Tour',
    type: 'tourism',
    pricePerPerson: 500000, // VND
    description: 'Explore the historic charm of Hanoi\'s Old Quarter with an experienced guide. Discover hidden gems, local culture, and delicious street food. Duration: 3 hours.',
    imageUrl: 'https://placehold.co/600x400.png', // Replace with actual or relevant placeholder
    availableTimes: ['09:00', '14:00'],
  },
  {
    id: 'itn_4',
    name: 'Full Day Hanoi City Tour',
    type: 'tourism',
    pricePerPerson: 1200000, // VND
    description: 'A comprehensive tour covering Hanoi\'s major landmarks including Hoan Kiem Lake, Temple of Literature, Ho Chi Minh Mausoleum, and more. Lunch included. Duration: 8 hours.',
    imageUrl: 'https://placehold.co/600x400.png', // Replace with actual or relevant placeholder
    availableTimes: ['08:30'],
  }
];

export let discountCodesDB: DiscountCode[] = [
  {
    id: 'dc_1',
    code: 'HANOI10',
    type: 'percentage',
    value: 10, // 10%
    isActive: true,
    description: 'Get 10% off your first trip booking.',
  },
  {
    id: 'dc_2',
    code: 'SAVE50K',
    type: 'fixed',
    value: 50000, // 50,000 VND
    isActive: true,
    description: 'Save 50,000 VND on any tourism package.',
  },
  {
    id: 'dc_3',
    code: 'EXPIRED',
    type: 'percentage',
    value: 20,
    isActive: false,
    description: 'This code is no longer active.',
  }
];

export let districtSurchargesDB: DistrictSurcharge[] = [
  { id: 'dist_1', districtName: 'Hoan Kiem', surchargeAmount: 0 }, // Base, no surcharge
  { id: 'dist_2', districtName: 'Ba Dinh', surchargeAmount: 20000 },
  { id: 'dist_3', districtName: 'Tay Ho', surchargeAmount: 50000 },
  { id: 'dist_4', districtName: 'Cau Giay', surchargeAmount: 70000 },
  { id: 'dist_5', districtName: 'Long Bien', surchargeAmount: 100000 },
  { id: 'dist_6', districtName: 'Thanh Xuan', surchargeAmount: 60000 },
  { id: 'dist_7', districtName: 'Ha Dong', surchargeAmount: 120000 }, // Example of a further district
];

export let additionalServicesDB: AdditionalService[] = [
  {
    id: 'svc_1',
    name: 'Extra Luggage (per piece)',
    price: 50000,
    applicableTo: ['airport_pickup', 'airport_dropoff'],
    iconName: 'Luggage',
  },
  {
    id: 'svc_2',
    name: 'English Speaking Guide/Translator',
    price: 500000, // Per trip/day
    applicableTo: ['tourism'],
    iconName: 'Languages',
  },
  {
    id: 'svc_3',
    name: 'Child Seat',
    price: 100000,
    applicableTo: ['airport_pickup', 'airport_dropoff'],
    iconName: 'Baby',
  },
  {
    id: 'svc_4',
    name: 'Premium Vehicle Upgrade',
    price: 300000,
    applicableTo: ['airport_pickup', 'airport_dropoff', 'tourism'],
    iconName: 'Car',
  }
];

// This will store all created trips. In a real app, this would be a database.
export let tripsDB: Trip[] = [];

export let feedbackDB: Feedback[] = [];
