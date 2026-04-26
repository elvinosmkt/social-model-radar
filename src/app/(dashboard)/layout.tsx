"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col relative">
                {/* Global Progress Bar Simulation */}
                <motion.div 
                    key={pathname + "-progress"}
                    initial={{ width: 0, opacity: 1 }}
                    animate={{ width: "100%", opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed top-0 left-64 right-0 h-[2px] bg-gradient-to-r from-primary to-primary-light z-[100] pointer-events-none"
                />

                <main className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
