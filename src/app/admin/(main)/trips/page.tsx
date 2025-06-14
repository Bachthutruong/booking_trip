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
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* <h1 className="text-3xl font-bold font-headline">管理行程预订</h1> */}
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Button asChild variant="secondary">
            <Link href="/admin/trips/pending-proof">待確認(已上傳付款證明)</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/trips/not-paid">未付款</Link>
          </Button>
        </div>
      </div>
      <TripsTable currentUser={{ id: user.userId as string, username: user.username as string, role: user.role as 'admin' | 'staff' }} />
    </div>
  );
}
