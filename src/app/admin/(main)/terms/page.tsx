import { getTermsContentCollection } from '@/lib/mongodb';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { revalidatePath } from 'next/cache';

export default async function AdminTermsPage() {
  const collection = await getTermsContentCollection();
  const doc = await collection.findOne({ key: 'booking_terms' });
  const content = doc?.content || '';

  // Form submit sẽ gọi API riêng, không fetch ở client nữa
  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>编辑预订条款与细则</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/api/admin/terms" method="POST">
            <Textarea
              className="min-h-[300px]"
              name="content"
              defaultValue={content}
              placeholder="请输入预订条款与细则..."
            />
            <Button className="mt-4" type="submit">
              保存
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 