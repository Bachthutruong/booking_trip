'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Feather } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: '首頁' },
  { href: '/create-trip', label: '建立行程' },
  { href: '/my-trips', label: '我的行程' },
  { href: '/join-trip', label: '加入行程' },
  { href: '/feedback', label: '回饋' },
  // { href: '/chatbot', label: '虛擬助理' },
];

export default function Navbar() {
  const pathname = usePathname();

  const NavLinksContent = () => (
    <>
      {navLinks.map((link) => (
        <Button key={link.href} variant="ghost" asChild
          className={cn(
            "justify-start md:justify-center transition-colors",
            pathname === link.href ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'hover:bg-secondary'
          )}
        >
          <Link href={link.href}>{link.label}</Link>
        </Button>
      ))}
    </>
  );

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Feather className="h-8 w-8" />
          <h1 className="text-2xl font-headline font-bold">河內探索者</h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-2">
          <NavLinksContent />
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">開啟導覽選單</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-4">
              <nav className="flex flex-col gap-3 mt-6">
                <NavLinksContent />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
