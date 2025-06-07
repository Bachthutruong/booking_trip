
'use client';

import { loginAdmin } from '@/actions/adminAuthActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, Loader2, LogIn, UserCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, FormEvent } from 'react'; // Removed useTransition, added FormEvent

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
      // The loginAdmin action will redirect on success (throws NEXT_REDIRECT),
      // or return an error object on failure.
      const result = await loginAdmin(formData, redirectPath);
      
      // This part should only execute if loginAdmin returns (i.e., login failed, no redirect)
      if (result && !result.success) {
        setError(result.message);
        toast({ title: 'Login Failed', description: result.message, variant: 'destructive' });
      }
      // If loginAdmin was successful and called redirect(), it would have thrown an error
      // which is caught by the catch block below.
      // If 'result' is undefined here AND no error was thrown, it's an unexpected state.

    } catch (e: any) {
      // For errors thrown by `redirect()`, e.digest will contain "NEXT_REDIRECT"
      // We must re-throw this specific error for Next.js to handle the redirection.
      if (e && typeof e.digest === 'string' && e.digest.includes('NEXT_REDIRECT')) {
        setIsLoading(false); // Important to reset loading before re-throwing
        throw e; 
      }
      
      // Handle other, unexpected errors
      setError(e.message || "An unexpected error occurred during login.");
      toast({ title: 'Login Error', description: e.message || "An unexpected error occurred.", variant: 'destructive' });
    } finally {
      // Only set isLoading to false if it wasn't a redirect error that was re-thrown
      // However, if throw e happens, this finally block might still execute.
      // It's safer to set isLoading false before the throw, or ensure it's handled if an error occurs.
      // If an error (non-redirect) occurred, or if login failed (result.success === false), set loading to false.
      // If a redirect is happening, the page will navigate away, so setIsLoading might not be strictly necessary here.
      // For simplicity and robustness, ensure it's false if we're not redirecting.
      // The setIsLoading(false) before `throw e` for redirect errors is important.
      // If we reach here and it's not a re-thrown redirect error, then loading should stop.
       if (!(e && typeof e.digest === 'string' && e.digest.includes('NEXT_REDIRECT'))) {
        setIsLoading(false);
      }
    }
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
              <Input id="username" name="username" type="text" placeholder="admin" required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center"><KeyRound className="mr-2 h-4 w-4" />Password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required disabled={isLoading} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
