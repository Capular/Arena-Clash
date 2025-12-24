import { Suspense } from "react";
import LayoutShell from "@/components/dashboard/LayoutShell";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import WalletView from "@/components/dashboard/WalletView";
import { Loader2 } from "lucide-react";

export default function WalletPage() {
    return (
        <LayoutShell>
            <DashboardHeader />
            <div className="container mx-auto p-4 lg:p-8 space-y-6 max-w-7xl">
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl lg:text-4xl font-bold font-rajdhani text-foreground tracking-wide">
                        My Wallet
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your balance, deposits, and withdrawals.
                    </p>
                </div>

                <Suspense fallback={
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                }>
                    <WalletView />
                </Suspense>
            </div>
        </LayoutShell>
    );
}
