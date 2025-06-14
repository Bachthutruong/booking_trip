import { NextResponse } from 'next/server';
import { getSpamReportsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAdminToken } from '@/actions/adminAuthActions';

export async function POST(req: Request) {
    try {
        const user = await verifyAdminToken();
        if (!user.isAuthenticated || user.role !== 'admin' || !user.username) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { reportedUserId, reportedUserPhone, reportedUserName, tripId, reason } = await req.json();

        if (!reportedUserPhone || !reportedUserName || !tripId || !reason) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const spamReportsCollection = await getSpamReportsCollection();
        const newObjectId = new ObjectId();

        const report = {
            _id: newObjectId,
            id: newObjectId.toString(),
            reportedUserId,
            reportedUserPhone,
            reportedUserName,
            reportedBy: user.username,
            tripId,
            reason,
            createdAt: new Date(),
            isHidden: false
        };

        await spamReportsCollection.insertOne(report);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error reporting spam:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const user = await verifyAdminToken();
        if (!user.isAuthenticated || user.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const spamReportsCollection = await getSpamReportsCollection();
        const reports = await spamReportsCollection.find({}).sort({ createdAt: -1 }).toArray();

        return NextResponse.json({ success: true, reports });
    } catch (error) {
        console.error('Error fetching spam reports:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
} 