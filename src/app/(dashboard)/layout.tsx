"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/shared/Sidebar";
import { BottomTab } from "@/components/shared/BottomTab";
import { useAuth } from "@/lib/context/AuthContext";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

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
        <div className="flex h-screen md:min-h-screen overflow-hidden md:overflow-visible bg-background text-foreground pb-24 md:pb-0 selection:bg-primary/30">
            <Sidebar />
            <div className="flex-1 ml-0 md:ml-64 flex flex-col h-full md:h-auto overflow-hidden md:overflow-visible relative">
                {/* Global Progress Bar Simulation */}
                <motion.div 
                    key={pathname + "-progress"}
                    initial={{ width: 0, opacity: 1 }}
                    animate={{ width: "100%", opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed top-0 left-0 md:left-64 right-0 h-[2px] bg-gradient-to-r from-primary to-primary-light z-[100] pointer-events-none"
                />

                <main className="flex-1 h-full md:h-auto overflow-hidden md:overflow-visible">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full md:h-auto"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
            <BottomTab />
        </div>
    );
}
