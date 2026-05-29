import { Header } from "@/components/shared/Header";
import { Pipeline } from "@/components/pipeline/Pipeline";

export default function PipelinePage() {
    return (
        <div className="flex flex-col h-screen">
            <Header
                title="Pipeline de Leads"
                subtitle="Gerencie o progresso das suas prospecções."
            />

            <div className="p-4 md:p-8 pb-0 overflow-hidden flex-1 flex flex-col no-scrollbar">
                <Pipeline />
            </div>
        </div>
    );
}
