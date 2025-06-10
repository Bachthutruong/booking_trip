import { getFeedbackById } from '@/actions/feedbackActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface FeedbackDetailsPageProps {
    params: { id: string };
}

export default async function FeedbackDetailsPage({ params }: FeedbackDetailsPageProps) {
    const { id } = params;
    const feedback = await getFeedbackById(id);

    if (!feedback) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold font-headline">反馈未找到</h1>
                <p>找不到ID为 &quot;{id}&quot; 的反馈。</p>
                <Button variant="outline" asChild>
                    <Link href="/admin/feedback">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        返回反馈列表
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">反馈详情</h1>
                <Button variant="outline" asChild>
                    <Link href="/admin/feedback">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        返回反馈列表
                    </Link>
                </Button>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>来自 {feedback.name} 的反馈</CardTitle>
                    <CardDescription>提交于 {format(new Date(feedback.submittedAt), "MMM dd, yyyy 'at' HH:mm")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm font-semibold">邮箱:</p>
                        <p>{feedback.email}</p>
                    </div>
                    {feedback.tripId && (
                        <div>
                            <p className="text-sm font-semibold">行程ID:</p>
                            <p>{feedback.tripId}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-sm font-semibold">消息:</p>
                        <p className="whitespace-pre-wrap">{feedback.message}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 