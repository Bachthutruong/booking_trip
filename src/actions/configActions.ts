'use server';

import { districtSurchargesDB, additionalServicesDB, discountCodesDB, availableTimes } from '@/lib/data';
import type { DistrictSurcharge, AdditionalService, DiscountCode } from '@/lib/types';

export async function getDistrictSurcharges(): Promise<DistrictSurcharge[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return JSON.parse(JSON.stringify(districtSurchargesDB));
}

export async function getAdditionalServices(): Promise<AdditionalService[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return JSON.parse(JSON.stringify(additionalServicesDB));
}

export async function getDiscountCodeDetails(code: string): Promise<DiscountCode | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  const discount = discountCodesDB.find(dc => dc.code.toUpperCase() === code.toUpperCase() && dc.isActive);
  return discount ? JSON.parse(JSON.stringify(discount)) : null;
}

export async function getAvailableTimes(): Promise<string[]> {
    // In a real app, this might be dynamic based on itinerary or admin settings
    await new Promise(resolve => setTimeout(resolve, 100));
    return JSON.parse(JSON.stringify(availableTimes));
}
