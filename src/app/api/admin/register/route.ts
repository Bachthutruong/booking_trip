import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getAdminUsersCollection } from '@/lib/mongodb';
import type { AdminUser } from '@/lib/types';
import { ObjectId } from 'mongodb';

const registerSchema = z.object({
    username: z.string().min(1, '用戶名稱是必填的').toLowerCase(),
    password: z.string().min(6, '密碼必須至少6個字符'),
});

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const validation = registerSchema.safeParse(json);

        if (!validation.success) {
            return NextResponse.json({ success: false, message: validation.error.errors.map(e => e.message).join(', ') }, { status: 400 });
        }

        const { username, password } = validation.data;

        const adminUsersCollection = await getAdminUsersCollection();

        // Check if username already exists
        const existingAdmin = await adminUsersCollection.findOne({ username });
        if (existingAdmin) {
            return NextResponse.json({ success: false, message: '用戶名稱已存在' }, { status: 409 });
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 10); // 10 salt rounds

        const newObjectId = new ObjectId();

        const newAdminUser: AdminUser = {
            _id: newObjectId,
            id: newObjectId.toString(),
            username,
            passwordHash,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await adminUsersCollection.insertOne(newAdminUser as any);

        if (result.acknowledged) {
            return NextResponse.json({ success: true, message: '管理員帳號已成功創建' });
        } else {
            return NextResponse.json({ success: false, message: '無法創建管理員帳號' }, { status: 500 });
        }

    } catch (error) {
        console.error('API Admin registration error:', error);
        return NextResponse.json({ success: false, message: '在註冊過程中發生意外錯誤' }, { status: 500 });
    }
} 