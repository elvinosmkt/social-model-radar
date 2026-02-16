import { Header } from "@/components/shared/Header";
import { Pipeline } from "@/components/pipeline/Pipeline";

export default function PipelinePage() {
    return (
        <div className="flex flex-col h-screen">
            <Header
                title="Pipeline de Leads"
                subtitle="Gerencie o progresso das suas prospecções."
            />

            <div className="p-8 pb-0 overflow-hidden flex-1 flex flex-col">
                <Pipeline />
            </div>
        </div>
    );
}
