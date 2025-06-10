import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Settings, LogOut, LayoutDashboard, ListOrdered, Feather, TicketPercent, Map, Users, Percent, MapPinned, Palette, Wand2, History, Bell, FileText, MessageSquare } from 'lucide-react';
import { logoutAdmin, verifyAdminToken } from '@/actions/adminAuthActions';

const adminNavLinks = [
  { href: '/admin/dashboard', label: '儀表板', icon: LayoutDashboard },
  { href: '/admin/itineraries', label: '行程', icon: ListOrdered },
  { href: '/admin/trips', label: '行程預訂', icon: History },
  { href: '/admin/trips/deleted', label: '已刪除的行程', icon: History, adminOnly: true },
  { href: '/admin/discounts', label: '折扣碼', icon: Percent },
  { href: '/admin/districts', label: '地區附加費', icon: MapPinned },
  { href: '/admin/services', label: '附加服務', icon: Wand2 },
  { href: '/admin/terms', label: '條款和條件', icon: FileText },
  { href: '/admin/feedback', label: '回饋', icon: MessageSquare },
  { href: '/admin/users', label: '用戶', icon: Users, adminOnly: true },
  // { href: '/admin/notifications', label: 'Notifications', icon: Bell }, // Example for future
  // { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifyAdminToken();
  const isAdmin = user.role === 'admin';
  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 flex-col border-r bg-background p-4 sm:flex">
        <Link href="/admin/dashboard" className="mb-8 flex items-center gap-2 text-lg font-semibold text-primary">
          <Feather className="h-7 w-7" />
          <span>管理員面板</span>
        </Link>
        <nav className="flex flex-col gap-1.5">
          {adminNavLinks
            .filter(link => isAdmin || !link.adminOnly)
            .map((link) => (
              <Button key={link.href} variant="ghost" className="justify-start gap-2.5 px-3 text-base" asChild>
                <Link href={link.href}>
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              </Button>
            ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 pt-4 border-t">
          <Button variant="outline" className="justify-start gap-2" asChild>
            <Link href="/">
              <Home className="h-5 w-5" />
              返回網站
            </Link>
          </Button>
          <form action={logoutAdmin}>
            <Button type="submit" variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-5 w-5" />
              登出
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
