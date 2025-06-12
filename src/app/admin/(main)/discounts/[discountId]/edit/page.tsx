import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DiscountCodeForm from "../../_components/DiscountCodeForm";
import { getDiscountCodeById, updateDiscountCode } from "@/actions/discountActions";
import type { DiscountCodeFormValues } from "@/lib/types";

export default async function EditDiscountPage({ params }: { params: { discountId: string } }) {
    const { discountId } = params;
    const discountCode = await getDiscountCodeById(discountId);

    if (!discountCode) {
        return (
            <div className="space-y-6 max-w-3xl mx-auto text-center py-10">
                <p className="text-destructive text-lg">折扣代码未找到。</p>
                <Button variant="outline" asChild>
                    <Link href="/admin/discounts"><ArrowLeft className="mr-2 h-4 w-4" /> 返回折扣碼管理</Link>
                </Button>
            </div>
        );
    }

    // Convert expiryDate from ISO string to Date object for the form's initialData
    // Also ensure _id (ObjectId) is not passed to the client component
    const { _id, ...plainDiscountCode } = discountCode;

    // Explicitly prepare the usageLimit to ensure its type is number or empty string
    const safeUsageLimit: number | '' = typeof plainDiscountCode.usageLimit === 'number'
        ? plainDiscountCode.usageLimit
        : (plainDiscountCode.usageLimit === undefined || plainDiscountCode.usageLimit === null || plainDiscountCode.usageLimit === '')
            ? ''
            : Number(plainDiscountCode.usageLimit) || ''; // Convert string to number, or default to empty string

    const initialFormData = {
        ...plainDiscountCode,
        expiryDate: plainDiscountCode.expiryDate ? new Date(plainDiscountCode.expiryDate) : null,
        usageLimit: safeUsageLimit,
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <Button variant="outline" asChild className="mb-4">
                <Link href="/admin/discounts"><ArrowLeft className="mr-2 h-4 w-4" /> 返回折扣碼管理</Link>
            </Button>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">編輯折扣碼: {discountCode.code}</CardTitle>
                    <CardDescription>編輯此折扣碼的詳細內容</CardDescription>
                </CardHeader>
                <CardContent>
                    <DiscountCodeForm
                        // @ts-ignore
                        initialData={initialFormData}
                        isEditMode={true}
                        discountId={discountCode.id}
                        submitButtonText="更新折扣碼"
                    />
                </CardContent>
            </Card>
        </div>
    );
} 