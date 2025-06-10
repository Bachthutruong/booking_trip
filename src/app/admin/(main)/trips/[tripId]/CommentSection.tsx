"use client";
import { useState, useTransition } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card-ext';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { updateTripComment } from '@/actions/tripActions';

export default function CommentSection({ tripId, initialComment, isDeleted }: { tripId: string, initialComment?: string, isDeleted?: boolean }) {
  const [comment, setComment] = useState(initialComment || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateTripComment(tripId, comment);
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } else {
        setError(res.message || '保存失败');
      }
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">[评论] 备注 & 工作交接</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="输入备注，工作交接信息..."
          className="mb-3"
          disabled={isDeleted || isPending}
        />
        <Button onClick={handleSave} className="mr-2" disabled={isDeleted || isPending}>保存备注</Button>
        {saved && <span className="text-green-600 text-sm ml-2">已保存成功!</span>}
        {error && <span className="text-destructive text-sm ml-2">{error}</span>}
        {isDeleted && <div className="text-destructive text-xs mt-2">无法编辑备注，因为行程已删除。</div>}
      </CardContent>
    </Card>
  );
} 