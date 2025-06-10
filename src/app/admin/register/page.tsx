'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, KeyRound, Loader2, UserCircle } from "lucide-react";
import { useState, FormEvent } from "react";
import { useRouter } from 'next/navigation';

export default function AdminRegisterPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);
        const username = formData.get('username');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        if (password !== confirmPassword) {
            setError("密碼不相符");
            setIsLoading(false);
            toast({ title: '註冊失敗', description: '密碼不相符', variant: 'destructive' });
            return;
        }

        try {
            const response = await fetch('/api/admin/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast({ title: '註冊成功', description: '管理員帳號已創建。您現在可以登錄', variant: 'default' });
                router.push('/admin/login');
            } else {
                setError(result.message);
                toast({ title: '註冊失敗', description: result.message, variant: 'destructive' });
            }
        } catch (e: any) {
            setError(e.message || "在註冊過程中發生意外錯誤");
            toast({ title: '註冊錯誤', description: e.message || "在註冊過程中發生意外錯誤", variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserPlus size={40} />
                    </div>
                    <CardTitle className="text-3xl font-headline">管理員註冊</CardTitle>
                    <CardDescription>創建新的管理員帳號</CardDescription>
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
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="flex items-center"><KeyRound className="mr-2 h-4 w-4" />確認密碼</Label>
                            <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" required disabled={isLoading} />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                            註冊
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
} 