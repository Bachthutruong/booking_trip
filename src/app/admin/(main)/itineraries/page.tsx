import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import ItinerariesTable from './ItinerariesTable';

export default function AdminItinerariesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">管理行程   </h1>
        <Button asChild>
          <Link href="/admin/itineraries/new">
            <PlusCircle className="mr-2 h-5 w-5" /> 建立行程
          </Link>
        </Button>
      </div>
      <ItinerariesTable />
    </div>
  );
}
