"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { BottomTab } from "@/components/shared/BottomTab";
import { useAuth } from "@/lib/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-text-secondary">Carregando painel seguro...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen md:min-h-screen overflow-hidden md:overflow-visible bg-background text-foreground pb-24 md:pb-0">
            <Sidebar />
            <div className="flex-1 ml-0 md:ml-64 flex flex-col h-full md:h-auto overflow-hidden md:overflow-visible">
                <main className="flex-1 h-full md:h-auto overflow-hidden md:overflow-visible">
                    {children}
                </main>
            </div>
            <BottomTab />
        </div>
    );
}
