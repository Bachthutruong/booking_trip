
import type { DiscountCode, DistrictSurcharge, AdditionalService } from './types';
import { MOCK_AVAILABLE_TIMES } from './constants';

// These configurations are still served from mock data for now.
// They can be migrated to MongoDB in a future step if needed.

export const availableTimes: string[] = MOCK_AVAILABLE_TIMES;

export const discountCodesDB: DiscountCode[] = [
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

export const districtSurchargesDB: DistrictSurcharge[] = [
  { id: 'dist_1', districtName: 'Hoan Kiem', surchargeAmount: 0 },
  { id: 'dist_2', districtName: 'Ba Dinh', surchargeAmount: 20000 },
  { id: 'dist_3', districtName: 'Tay Ho', surchargeAmount: 50000 },
  { id: 'dist_4', districtName: 'Cau Giay', surchargeAmount: 70000 },
  { id: 'dist_5', districtName: 'Long Bien', surchargeAmount: 100000 },
  { id: 'dist_6', districtName: 'Thanh Xuan', surchargeAmount: 60000 },
  { id: 'dist_7', districtName: 'Ha Dong', surchargeAmount: 120000 },
];

export const additionalServicesDB: AdditionalService[] = [
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
    price: 500000,
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

// itinerariesDB, tripsDB, feedbackDB are no longer exported from here
// as their data will be managed via MongoDB through their respective actions.
