import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getAdminUsersCollection } from '@/lib/mongodb';
import type { AdminUser } from '@/lib/types';
import { ObjectId } from 'mongodb';

const registerSchema = z.object({
    username: z.string().min(1, 'Username is required').toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters long.'),
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
            return NextResponse.json({ success: false, message: 'Username already exists.' }, { status: 409 });
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
            return NextResponse.json({ success: true, message: 'Admin account created successfully.' });
        } else {
            return NextResponse.json({ success: false, message: 'Failed to create admin account.' }, { status: 500 });
        }

    } catch (error) {
        console.error('API Admin registration error:', error);
        return NextResponse.json({ success: false, message: 'An unexpected error occurred during registration.' }, { status: 500 });
    }
} 