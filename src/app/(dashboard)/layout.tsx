import { Sidebar } from "@/components/shared/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
