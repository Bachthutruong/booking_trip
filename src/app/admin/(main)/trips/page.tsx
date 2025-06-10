import { getTripsPaginated, getTripsCount } from '@/actions/tripActions';
import { verifyAdminToken } from '@/actions/adminAuthActions';
import TripsTable from './TripsTable';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AdminTripsPageProps {
  searchParams?: { status?: string; search?: string; page?: string };
}

export default async function AdminTripsPage({ searchParams }: AdminTripsPageProps) {
  const user = await verifyAdminToken();
  if (!user.isAuthenticated || !user.userId || !user.username || !user.role) {
    return <div>您没有权限访问此页面。</div>;
  }
  const statusFilter = searchParams?.status ?? '';
  const searchTerm = searchParams?.search?.toLowerCase() ?? '';
  const page = parseInt(searchParams?.page || '1', 10);
  const PAGE_SIZE = 10;
  const skip = (page - 1) * PAGE_SIZE;
  const trips = await getTripsPaginated(PAGE_SIZE, skip, searchTerm, statusFilter);
  const totalTrips = await getTripsCount(searchTerm, statusFilter);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">管理行程预订</h1>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Button asChild variant="secondary">
            <Link href="/admin/trips/pending-proof">待审核凭证</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/trips/not-paid">未付款</Link>
          </Button>
        </div>
      </div>
      <TripsTable trips={trips} totalTrips={totalTrips} currentUser={{ id: user.userId as string, username: user.username as string, role: user.role as 'admin' | 'staff' }} />
    </div>
  );
}
