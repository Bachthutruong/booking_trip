
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, MapIcon, MessageSquare, Settings, LogOut, LayoutDashboard, ListOrdered, Feather } from 'lucide-react';
import { logoutAdmin } from '@/actions/adminAuthActions';

const adminNavLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/itineraries', label: 'Itineraries', icon: ListOrdered },
  // { href: '/admin/trips', label: 'Trips', icon: MapIcon },
  // { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  // { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 flex-col border-r bg-background p-4 sm:flex">
        <Link href="/admin/dashboard" className="mb-8 flex items-center gap-2 text-lg font-semibold text-primary">
          <Feather className="h-7 w-7" />
          <span>Admin Panel</span>
        </Link>
        <nav className="flex flex-col gap-2">
          {adminNavLinks.map((link) => (
            <Button key={link.href} variant="ghost" className="justify-start gap-2" asChild>
              <Link href={link.href}>
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <Button variant="outline" className="justify-start gap-2" asChild>
            <Link href="/">
              <Home className="h-5 w-5" />
              Back to Site
            </Link>
          </Button>
          <form action={logoutAdmin}>
            <Button type="submit" variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </form>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        {/* Mobile header can be added here if needed */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
