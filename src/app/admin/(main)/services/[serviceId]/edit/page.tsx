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
                    <Link href="/admin/services"><ArrowLeft className="mr-2 h-4 w-4" /> 返回附加服务</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <Button variant="outline" asChild className="mb-4">
                <Link href="/admin/services"><ArrowLeft className="mr-2 h-4 w-4" /> 返回附加服务</Link>
            </Button>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">编辑附加服务: {additionalService.name}</CardTitle>
                    <CardDescription>更新此附加服务的详细信息。</CardDescription>
                </CardHeader>
                <CardContent>
                    <AdditionalServiceForm
                        initialData={additionalService}
                        isEditMode={true}
                        serviceId={additionalService.id}
                        submitButtonText="更新服务"
                    />
                </CardContent>
            </Card>
        </div>
    );
} 