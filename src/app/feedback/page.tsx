
import FeedbackForm from '@/components/feedback/FeedbackForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquareHeart } from 'lucide-react';

export default function FeedbackPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <MessageSquareHeart className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">Share Your Feedback</CardTitle>
            <CardDescription className="text-lg">
              We value your opinion! Let us know about your experience with Hanoi Explorer.
              If your feedback relates to a specific trip, please enter your phone number so we can list your recent trips.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
