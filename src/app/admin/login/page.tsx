
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
        // The loginAdmin action will redirect on success, so 'result' will be undefined
        // if the redirect happens. If it returns a value, it means login failed.
        const result = await loginAdmin(formData, redirectPath);
        
        if (result) { 
          // This block is only reached if loginAdmin returns (i.e., login failed)
          if (!result.success) {
            setError(result.message);
            toast({ title: 'Login Failed', description: result.message, variant: 'destructive' });
          }
        }
        // If 'result' is undefined, it implies a server-side redirect occurred or is in progress.
        // Next.js handles the page transition in that case.

      } catch (e: any) {
        // Check if the error is the specific NEXT_REDIRECT error
        if (e?.digest?.startsWith('NEXT_REDIRECT')) {
          // This is an expected error thrown by redirect().
          // Next.js will handle the actual redirection.
          // Re-throw the error to let Next.js complete the redirection process.
          throw e; 
        }
        
        // Handle other, unexpected errors
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
