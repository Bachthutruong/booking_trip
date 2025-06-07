import { getAllFeedback } from '@/actions/feedbackActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { MessageSquare, Eye } from 'lucide-react';
import { format } from 'date-fns';
import type { Feedback } from '@/lib/types';

export default async function AdminFeedbackPage() {
    const feedbackEntries = await getAllFeedback();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">Manage Feedback ({feedbackEntries.length})</h1>
                {/* Optional: Add a button to filter/search feedback if needed */}
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Feedback List</CardTitle>
                    <CardDescription>View all customer feedback submissions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {feedbackEntries.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No feedback submissions found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Submitted By</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Trip ID</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead>Submitted At</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {feedbackEntries.map((feedback: Feedback) => (
                                        <TableRow key={feedback.id}>
                                            <TableCell className="font-medium">{feedback.name}</TableCell>
                                            <TableCell>{feedback.email}</TableCell>
                                            <TableCell>{feedback.tripId || 'N/A'}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm max-w-sm overflow-hidden text-ellipsis whitespace-nowrap">
                                                {feedback.message}
                                            </TableCell>
                                            <TableCell>{format(new Date(feedback.submittedAt), "MMM dd, yyyy HH:mm")}</TableCell>
                                            <TableCell className="text-right">
                                                {/* In a real app, you might have a dedicated view for full message */}
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/feedback/${feedback.id}`}>View</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 