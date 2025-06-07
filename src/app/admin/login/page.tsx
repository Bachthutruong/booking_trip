
'use client';

import { loginAdmin } from '@/actions/adminAuthActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2, LogIn, UserCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const redirectPath = searchParams.get('redirect') || '/admin/dashboard';

    startTransition(async () => {
      try {
        // Pass the redirectPath to the server action
        const result = await loginAdmin(formData, redirectPath);
        
        // If 'result' is defined, it means the server action returned,
        // which implies a login failure (because success cases redirect and don't return).
        if (result) {
          if (!result.success) { // Check if login was explicitly unsuccessful
            setError(result.message);
            toast({ title: 'Login Failed', description: result.message, variant: 'destructive' });
          }
        }
        // If 'result' is undefined, it implies a successful server-side redirect occurred,
        // and Next.js is handling the page transition. No client-side action needed here.

      } catch (e: any) {
        // This catch block handles unexpected errors during the action call itself,
        // or if the action throws an error that isn't a Next.js redirect.
        // NEXT_REDIRECT errors are typically handled by Next.js before reaching here.
        setError(e.message || "An unexpected error occurred during login.");
        toast({ title: 'Login Error', description: e.message || "An unexpected error occurred.", variant: 'destructive' });
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCircle size={40} />
          </div>
          <CardTitle className="text-3xl font-headline">Admin Login</CardTitle>
          <CardDescription>Access the Hanoi Explorer management panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center"><UserCircle className="mr-2 h-4 w-4" />Username</Label>
              <Input id="username" name="username" type="text" placeholder="admin" required disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center"><KeyRound className="mr-2 h-4 w-4" />Password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required disabled={isPending} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full text-lg py-6" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
