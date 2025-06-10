"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Giả lập API, sau này thay bằng fetch thực tế
async function fetchTermsContent() {
  const res = await fetch("/api/admin/terms");
  if (!res.ok) throw new Error("Failed to fetch terms ");
  return res.json();
}
async function updateTermsContent(content: string) {
  const res = await fetch("/api/admin/terms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to update terms");
  return res.json();
}

export default function AdminTermsPage() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTermsContent()
      .then((data) => setContent(data.content || ""))
      .catch(() => toast({ title: "错误", description: "无法加载条款。", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTermsContent(content);
      toast({ title: "已保存", description: "条款已成功更新。" });
    } catch {
      toast({ title: "错误", description: "无法保存条款。", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>编辑预订条款与细则</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-[300px]"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="请输入预订条款与细则..."
            disabled={loading || saving}
          />
          <Button className="mt-4" onClick={handleSave} disabled={loading || saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 