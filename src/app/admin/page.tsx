"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/tournaments');
    }, [router]);

    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-primary mr-2" />
            <span className="font-rajdhani font-medium text-foreground">Redirecting...</span>
        </div>
    );
}
