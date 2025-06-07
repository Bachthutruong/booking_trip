
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Settings, LogOut, LayoutDashboard, ListOrdered, Feather, TicketPercent, Map, Users, Percent, MapPinned, Palette, Wand2, History, Bell } from 'lucide-react';
import { logoutAdmin } from '@/actions/adminAuthActions';

const adminNavLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/itineraries', label: 'Itineraries', icon: ListOrdered },
  { href: '/admin/trips', label: 'Trip Bookings', icon: History },
  { href: '/admin/discounts', label: 'Discount Codes', icon: Percent },
  { href: '/admin/districts', label: 'District Surcharges', icon: MapPinned },
  { href: '/admin/services', label: 'Additional Services', icon: Wand2 },
  // { href: '/admin/feedback', label: 'Feedback', icon: MessageSquare }, // Assuming MessageSquare was for feedback
  // { href: '/admin/users', label: 'Users', icon: Users }, // Example for future
  // { href: '/admin/notifications', label: 'Notifications', icon: Bell }, // Example for future
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
        <nav className="flex flex-col gap-1.5">
          {adminNavLinks.map((link) => (
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
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
