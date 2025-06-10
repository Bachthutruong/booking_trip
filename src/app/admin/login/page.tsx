'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2, LogIn, UserCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, FormEvent } from 'react'; // Removed useTransition, added FormEvent
import Link from 'next/link'; // Corrected import from next/link

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false); // Replaced useTransition's isPending
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true); // Set loading state

    const formData = new FormData(event.currentTarget);
    const redirectPath = searchParams.get('redirect') || '/admin/dashboard';

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Login successful, redirect
        window.location.href = redirectPath; // Client-side redirect
      } else {
        // Login failed, display error message
        setError(result.message);
        toast({ title: '登錄失敗', description: result.message, variant: 'destructive' });
      }
    } catch (e: any) {
      setError(e.message || "在登錄過程中發生意外錯誤");
      toast({ title: '登錄錯誤', description: e.message || "在登錄過程中發生意外錯誤", variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle size={40} />
          </div>
          <CardTitle className="text-3xl font-headline">管理員登錄</CardTitle>
          <CardDescription>訪問河內探險家管理面板</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center"><UserCircle className="mr-2 h-4 w-4" />用戶名稱</Label>
              <Input id="username" name="username" type="text" placeholder="admin" required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center"><KeyRound className="mr-2 h-4 w-4" />密碼</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required disabled={isLoading} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
              登錄
            </Button>
            {/* <div className="text-center mt-4">
              <Link href="/admin/register" className="text-primary hover:underline">
                沒有管理員帳號？註冊這裡
              </Link>
            </div> */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
