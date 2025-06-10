import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdditionalServiceForm from "../_components/AdditionalServiceForm";

export default function NewAdditionalServicePage() {
    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <Button variant="outline" asChild className="mb-4">
                <Link href="/admin/services"><ArrowLeft className="mr-2 h-4 w-4" /> 返回附加服务</Link>
            </Button>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">创建新附加服务</CardTitle>
                    <CardDescription>填写详细信息以创建新的附加服务。</CardDescription>
                </CardHeader>
                <CardContent>
                    <AdditionalServiceForm />
                </CardContent>
            </Card>
        </div>
    );
} 