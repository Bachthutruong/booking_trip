import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DistrictSurchargeForm from "../_components/DistrictSurchargeForm"; // Import the DistrictSurchargeForm component

export default function NewDistrictSurchargePage() {
    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <Button variant="outline" asChild className="mb-4">
                <Link href="/admin/districts"><ArrowLeft className="mr-2 h-4 w-4" /> Back to District Surcharges</Link>
            </Button>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Create New District Surcharge</CardTitle>
                    <CardDescription>Fill in the details to create a new district surcharge.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DistrictSurchargeForm />
                </CardContent>
            </Card>
        </div>
    );
} 