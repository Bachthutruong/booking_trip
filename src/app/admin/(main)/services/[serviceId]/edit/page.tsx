import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdditionalServiceForm from "../../_components/AdditionalServiceForm";
import { getAdditionalServiceById } from "@/actions/additionalServiceActions";

export default async function EditAdditionalServicePage({ params }: { params: { serviceId: string } }) {
    const { serviceId } = params;
    const additionalService = await getAdditionalServiceById(serviceId);

    if (!additionalService) {
        return (
            <div className="space-y-6 max-w-3xl mx-auto text-center py-10">
                <p className="text-destructive text-lg">附加服务未找到。</p>
                <Button variant="outline" asChild>
                    <Link href="/admin/services"><ArrowLeft className="mr-2 h-4 w-4" /> 返回附加服務</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <Button variant="outline" asChild className="mb-4">
                <Link href="/admin/services"><ArrowLeft className="mr-2 h-4 w-4" /> 返回附加服務</Link>
            </Button>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">編輯附加服務: {additionalService.name}</CardTitle>
                    <CardDescription>更新此附加服務的詳細內容</CardDescription>
                </CardHeader>
                <CardContent>
                    <AdditionalServiceForm
                        initialData={additionalService}
                        isEditMode={true}
                        serviceId={additionalService.id}
                        submitButtonText="更新附加服務"
                    />
                </CardContent>
            </Card>
        </div>
    );
} 