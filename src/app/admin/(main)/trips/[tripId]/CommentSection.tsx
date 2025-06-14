"use client";
import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card-ext';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

// Helper to fetch current admin user info
async function fetchCurrentUser() {
  try {
    const res = await fetch('/api/admin/me');
    if (!res.ok) return null;
    const data = await res.json();
    return data?.username || null;
  } catch {
    return null;
  }
}

// Helper to fetch and update comments
async function fetchComments(tripId: string) {
  const res = await fetch(`/api/admin/trips/${tripId}/comments`);
  if (!res.ok) return [];
  return await res.json();
}

async function postComment(tripId: string, comment: string, username: string) {
  const res = await fetch(`/api/admin/trips/${tripId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment, username }),
  });
  return await res.json();
}

export default function CommentSection({ tripId, initialComment, isDeleted }: { tripId: string, initialComment?: string, isDeleted?: boolean }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch user and comments on mount
  useEffect(() => {
    fetchCurrentUser().then(setUsername);
    fetchComments(tripId).then(setComments);
  }, [tripId]);

  // Scroll to bottom when comments change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSend = async () => {
    if (!newComment.trim() || !username) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await postComment(tripId, newComment, username);
      if (res.success) {
        setComments(res.comments); // Assume API returns updated comments array
        setNewComment('');
      } else {
        setError(res.message || '无法保存评论');
      }
    } catch (e: any) {
      setError(e.message || '无法保存评论');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">備註與交接</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-y-auto mb-4 bg-muted rounded p-3 space-y-3">
          {comments.length === 0 && (
            <div className="text-muted-foreground text-sm text-center">無備註</div>
          )}
          {comments.map((c, idx) => (
            <div key={idx} className={`flex flex-col ${c.username === username ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-lg px-4 py-2 mb-1 ${c.username === username ? 'bg-primary text-white' : 'bg-white border'}`}>{c.comment}</div>
              <div className="text-xs text-muted-foreground">
                {c.username} · {format(new Date(c.createdAt), 'yyyy-MM-dd HH:mm')}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2">
          <Textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="輸入備註或交接的內容"
            className="flex-1"
            disabled={isDeleted || isLoading || !username}
            rows={2}
          />
          <Button onClick={handleSend} disabled={isDeleted || isLoading || !newComment.trim() || !username}>
            發送
          </Button>
        </div>
        {error && <div className="text-destructive text-sm mt-2">{error}</div>}
        {isDeleted && <div className="text-destructive text-xs mt-2">无法编辑备注，因为行程已删除。</div>}
      </CardContent>
    </Card>
  );
} 