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
            <CardTitle className="font-headline text-3xl">分享您的回饋</CardTitle>
            <CardDescription className="text-lg">
              我們重視您的意見！讓我們知道您對河內探索者的看法。
              如果您對特定旅程的回饋，請輸入您的電話號碼，以便我們列出您的最近旅程。
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
