import { getAllAdditionalServices } from '@/actions/additionalServiceActions';
import AdminServicesPageClient from './_components/AdminServicesPageClient';
import { ITINERARY_TYPES } from '@/lib/constants';
import type { AdditionalService, ItineraryType } from '@/lib/types';

export default async function AdminServicesPage() {
    const additionalServices = await getAllAdditionalServices();
    return <AdminServicesPageClient initialServices={additionalServices} />;
} 