
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useTransition } from "react";
import { useToast } from "@/hooks/use-toast"; // Corrected path
import { submitFeedback } from '@/actions/feedbackActions';
import { getTripsForUserFeedback } from '@/actions/tripActions';
import type { FeedbackFormValues } from '@/lib/types';
import { Loader2, User, Mail, Hash, MessageCircle, Search, Phone } from "lucide-react";

const feedbackFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Invalid email address."),
  phoneForTrips: z.string().optional(), // For fetching user's trips
  tripId: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters long.").max(1000),
});

export default function FeedbackForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTrips, setUserTrips] = useState<{ id: string; name: string }[]>([]);
  const [phoneForTrips, setPhoneForTrips] = useState("");
  const [isFetchingTrips, startFetchingTripsTransition] = useTransition();

  const form = useForm<z.infer<typeof feedbackFormSchema>>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const handleFetchUserTrips = () => {
    if (!phoneForTrips.trim()) {
      toast({ title: "电话号码要求", description: "请输入你的电话号码以找到相关行程。", variant: "destructive" });
      return;
    }
    startFetchingTripsTransition(async () => {
      try {
        const trips = await getTripsForUserFeedback(phoneForTrips);
        setUserTrips(trips);
        if (trips.length === 0) {
          toast({ title: "未找到行程", description: "未找到此电话号码的行程。" });
        }
      } catch (error) {
        toast({ title: "错误获取行程", description: "无法获取你的行程。", variant: "destructive" });
      }
    });
  };


  async function onSubmit(values: z.infer<typeof feedbackFormSchema>) {
    setIsSubmitting(true);
    try {
      // Remove phoneForTrips before submitting actual feedback data
      const { phoneForTrips, ...feedbackData } = values;
      const result = await submitFeedback(feedbackData);

      if (result.success) {
        toast({
          title: "反馈提交成功！",
          description: result.message,
        });
        form.reset();
        setUserTrips([]);
        setPhoneForTrips("");
      } else {
        toast({
          title: "错误",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "发生意外错误。请再试一次。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><User className="h-4 w-4 mr-2 text-primary" />你的名字 *</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><Mail className="h-4 w-4 mr-2 text-primary" />你的邮箱 *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel className="flex items-center"><Phone className="h-4 w-4 mr-2 text-primary" />你的电话 (用于查找相关行程)</FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="输入用于预订的电话号码"
              value={phoneForTrips}
              onChange={(e) => setPhoneForTrips(e.target.value)}
              type="tel"
            />
            {/* <Button type="button" variant="outline" onClick={handleFetchUserTrips} disabled={isFetchingTrips || !phoneForTrips.trim()}>
                    {isFetchingTrips ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                    <span className="ml-2 hidden sm:inline">查找行程</span>
                </Button> */}
          </div>
          <FormDescription>如果你的反馈是关于特定行程，请输入你的电话号码以选择它。</FormDescription>
        </div>

        {userTrips.length > 0 && (
          <FormField
            control={form.control}
            name="tripId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Hash className="h-4 w-4 mr-2 text-primary" />相关行程 (可选)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="如果适用，请选择一个行程" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {userTrips.map(trip => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center"><MessageCircle className="h-4 w-4 mr-2 text-primary" />你的反馈 *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="告诉我们你的体验..."
                  className="resize-y min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting || isFetchingTrips}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              提交中...
            </>
          ) : (
            'Send Feedback'
          )}
        </Button>
      </form>
    </Form>
  );
}

