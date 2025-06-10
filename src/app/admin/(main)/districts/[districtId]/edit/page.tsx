import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DistrictSurchargeForm from "../../_components/DistrictSurchargeForm";
import { getDistrictSurchargeById } from "@/actions/districtActions";

export default async function EditDistrictSurchargePage({ params }: { params: { districtId: string } }) {
    const { districtId } = params;
    const districtSurcharge = await getDistrictSurchargeById(districtId);

    if (!districtSurcharge) {
        return (
            <div className="space-y-6 max-w-3xl mx-auto text-center py-10">
                <p className="text-destructive text-lg">区域附加费用未找到。</p>
                <Button variant="outline" asChild>
                    <Link href="/admin/districts"><ArrowLeft className="mr-2 h-4 w-4" /> 返回区域附加费用</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <Button variant="outline" asChild className="mb-4">
                <Link href="/admin/districts"><ArrowLeft className="mr-2 h-4 w-4" /> 返回区域附加费用</Link>
            </Button>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">编辑区域附加费用: {districtSurcharge.districtName}</CardTitle>
                    <CardDescription>更新此区域附加费用的详细信息。</CardDescription>
                </CardHeader>
                <CardContent>
                    <DistrictSurchargeForm
                        initialData={districtSurcharge}
                        isEditMode={true}
                        districtId={districtSurcharge.id}
                        submitButtonText="更新附加费用"
                    />
                </CardContent>
            </Card>
        </div>
    );
} 