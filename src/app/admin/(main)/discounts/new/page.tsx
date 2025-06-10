import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, PlusCircle } from "lucide-react";
import DiscountCodeForm from "../_components/DiscountCodeForm"; // Import the DiscountCodeForm component

export default function NewDiscountPage() {
    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <Button variant="outline" asChild className="mb-4">
                <Link href="/admin/discounts"><ArrowLeft className="mr-2 h-4 w-4" /> 返回折扣代码</Link>
            </Button>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">创建新的折扣代码</CardTitle>
                    <CardDescription>填写详细信息以创建新的折扣代码。</CardDescription>
                </CardHeader>
                <CardContent>
                    <DiscountCodeForm />
                </CardContent>
            </Card>
        </div>
    );
} 