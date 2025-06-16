"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';

export default function AdminTermsPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch nội dung term hiện tại khi component mount
  useEffect(() => {
    fetch('/api/admin/terms')
      .then(res => res.json())
      .then(data => setContent(data.content || ''));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('content', content);
    const res = await fetch('/api/admin/terms', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      toast({ title: '更新成功', description: '條款內容已成功更新！' });
    } else {
      toast({ title: '更新失敗', description: '更新條款時發生錯誤。', variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>編輯同意條款內容</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Textarea
              className="min-h-[300px]"
              name="content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="請輸入詳細的條款內容"
            />
            <Button className="mt-4" type="submit" disabled={loading}>
              {loading ? '正在更新…' : '更新'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 