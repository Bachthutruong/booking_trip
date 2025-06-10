import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getAdminUsersCollection } from '@/lib/mongodb';
import { z } from 'zod';
import type { AdminUser } from '@/lib/types'; // Make sure to import AdminUser type

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET 未在環境變量中定義');
}

const loginSchema = z.object({
    username: z.string().min(1, '用戶名稱是必填的'),
    password: z.string().min(1, '密碼是必填的'),
});

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const validation = loginSchema.safeParse(json);

        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }

        const { username, password } = validation.data;

        const adminUsersCollection = await getAdminUsersCollection();
        const adminUser = await adminUsersCollection.findOne({ username: username.toLowerCase() });

        if (!adminUser) {
            return NextResponse.json({ success: false, message: '無效的用戶名稱或密碼' }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, adminUser.passwordHash);

        if (!isPasswordValid) {
            return NextResponse.json({ success: false, message: '無效的用戶名稱或密碼' }, { status: 401 });
        }

        // Password is valid, create and set JWT
        const token = jwt.sign({ userId: adminUser._id.toString() }, JWT_SECRET!, {
            expiresIn: '7d', // Token valid for 7 days
        });

        const headers = new Headers();
        // This is for setting the cookie. In an API route, you directly set the cookie in the response.
        // However, the `cookies()` helper is primarily for server components/actions.
        // For API routes, you'd typically set the Set-Cookie header manually or use a middleware if complex.
        // For simplicity, let's try using `cookies().set` in API route as it's often supported.
        (await cookies()).set('admin-auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 1 week (matches token expiry)
            sameSite: 'lax',
        });

        return NextResponse.json({ success: true, message: '登錄成功' });

    } catch (error) {
        console.error('API Admin login error:', error);
        return NextResponse.json({ success: false, message: '在登錄過程中發生意外錯誤。請再試一次。' }, { status: 500 });
    }
} 