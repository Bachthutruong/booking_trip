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
            <CardTitle className="font-headline text-3xl">聯絡客服</CardTitle>
            <CardDescription className="text-lg">
            我們重視您的需求！如果您對行程、訂單、付款或其他事項有任何疑問，歡迎透過此表單與我們聯繫。我們會儘快回覆您。如需查詢特定行程，請提供您的電話號碼以方便查找。
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
