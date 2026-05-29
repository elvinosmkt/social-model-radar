"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Zap, Eye, EyeOff, Loader2, AlertCircle, 
    Mail, Lock, ChevronRight, Fingerprint, Radar, Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/context/AuthContext";

// ── Banco de Leads Escaneados Simulados em Tempo Real ─────────────────
const SCANNED_LEADS = [
    { 
        id: 1, 
        username: "@amanda.costa", 
        name: "Amanda Costa", 
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80", 
        score: "98%", 
        status: "MATCH",
        desc: "Perfil de alto engajamento na categoria moda e beleza. Captada ativamente pela equipe Delta com 98% de compatibilidade." 
    },
    { 
        id: 2, 
        username: "@carol_mendes", 
        name: "Carolina Mendes", 
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", 
        score: "92%", 
        status: "COMPATÍVEL",
        desc: "Modelo comercial com foco em lifestyle urbano. Perfil verificado pelo banco de dados cruzado anti-duplicidade." 
    },
    { 
        id: 3, 
        username: "@julia.rossi", 
        name: "Julia Rossi", 
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80", 
        score: "95%", 
        status: "LEAD SALVO",
        desc: "Influenciadora fitness com alto alcance orgânico. Pré-qualificada com distribuição de crédito da equipe." 
    },
    { 
        id: 4, 
        username: "@nara.antunes", 
        name: "Nara Antunes", 
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80", 
        score: "96%", 
        status: "MATCH",
        desc: "Perfil focado em joias e fotografia editorial. Registrada automaticamente pelo robô scouter nas últimas varreduras." 
    },
];

const MOCK_USERS = [
    { email: "carlos@dwsscouter.com",    password: "vendedor123", role: "vendedor",   name: "Carlos Mendes",  redirect: "/vendedor" },
    { email: "rafaela@dwsscouter.com",   password: "scout123",    role: "webscouter", name: "Rafaela Costa",  redirect: "/dashboard" },
];

export default function LoginPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    
    // Form States
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Sync Telemetry & Floating Testimonial State
    const [leadIndex, setLeadIndex] = useState(0);
    const [telemetryLogs, setTelemetryLogs] = useState<any[]>([]);

    useEffect(() => {
        // Build initial logs
        setTelemetryLogs(
            SCANNED_LEADS.map((lead, i) => ({
                id: lead.id,
                username: lead.username,
                status: lead.status,
                score: lead.score,
                time: `${i * 3 + 2}s atrás`
            }))
        );

        // Sync visual radar cycle
        const interval = setInterval(() => {
            setLeadIndex(prev => {
                const nextIndex = (prev + 1) % SCANNED_LEADS.length;
                const nextLead = SCANNED_LEADS[nextIndex];
                
                // Prepend new log
                setTelemetryLogs(logs => [
                    {
                        id: Date.now(),
                        username: nextLead.username,
                        status: nextLead.status,
                        score: nextLead.score,
                        time: "Agora"
                    },
                    ...logs.map(l => {
                        if (l.time === "Agora") return { ...l, time: "3s atrás" };
                        if (l.time.includes("s atrás")) {
                            const sec = parseInt(l.time) + 3;
                            return { ...l, time: `${sec}s atrás` };
                        }
                        return l;
                    }).slice(0, 3)
                ]);

                return nextIndex;
            });
        }, 4500);

        return () => clearInterval(interval);
    }, []);

    // Redirect authenticated users based on their database role
    useEffect(() => {
        const checkRoleAndRedirect = async () => {
            if (!authLoading && user) {
                try {
                    const { data: profile, error } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', user.id)
                        .single();

                    if (!error && profile) {
                        if (profile.role === 'admin') {
                            router.push("/admin");
                            return;
                        } else if (profile.role === 'vendedor') {
                            router.push("/vendedor");
                            return;
                        }
                    }
                } catch (err) {
                    console.warn("Could not determine role on auto-redirect:", err);
                }
                router.push("/dashboard");
            }
        };

        checkRoleAndRedirect();
    }, [user, authLoading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // 1. Mock users flow fallback
        const matchedMock = MOCK_USERS.find(u => u.email === email && u.password === password);
        if (matchedMock) {
            await new Promise(r => setTimeout(r, 1200));
            router.push(matchedMock.redirect);
            return;
        }

        // 2. Supabase Auth fallback
        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (authError) throw authError;

            if (authData.user) {
                try {
                    const { data: profile, error: profileError } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', authData.user.id)
                        .single();

                    if (!profileError && profile) {
                        if (profile.role === 'admin') {
                            router.push("/admin");
                            return;
                        } else if (profile.role === 'vendedor') {
                            router.push("/vendedor");
                            return;
                        }
                    }
                } catch (e) {
                    console.warn("Could not fetch user role, defaulting to dashboard", e);
                }
            }

            router.push("/dashboard");
        } catch (err: any) {
            console.error("Auth error:", err);
            setError(err.message || "E-mail ou senha incorretos.");
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-text-secondary font-medium tracking-wider">Iniciando console scouter...</p>
                </div>
            </div>
        );
    }

    const currentLead = SCANNED_LEADS[leadIndex];

    return (
        <div className="min-h-screen bg-[#050505] w-full flex items-center justify-center relative overflow-hidden font-inter">
            
            {/* Split View Container ocupando 100% da tela */}
            <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12 relative z-10">
                
                {/* ── LADO ESQUERDO: Painel de Login Minimalista (Col 6) ────────────────────────── */}
                <div className="col-span-1 lg:col-span-6 flex flex-col justify-between p-8 sm:p-12 xl:p-20 bg-[#050505] relative z-20">
                    
                    {/* Glowing lights no fundo esquerdo */}
                    <div className="pointer-events-none absolute top-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-primary/3 blur-[120px] -z-10 animate-pulse" />
                    
                    {/* Header: Logo */}
                    <div className="flex items-center justify-between w-full mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_35px_rgba(212,175,55,0.25)] border border-primary/20">
                                <Zap className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <h1 className="text-lg font-outfit font-bold premium-gradient-text tracking-tight">DWS SCOUTER</h1>
                                <p className="text-[8px] text-text-secondary uppercase tracking-[0.25em] font-semibold">Digital Web Scouter</p>
                            </div>
                        </div>

                        {/* Hierarquia Visual */}
                        <div className="flex items-center gap-1.5 text-[8px] font-bold text-text-secondary/50">
                            <span className="px-1.5 py-0.5 rounded bg-primary/5 text-primary/70 border border-primary/25">ADM</span>
                            <span>›</span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/5 text-blue-400 border border-blue-500/25">VENDEDOR</span>
                            <span>›</span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/5 text-purple-400 border border-purple-500/25">SCOUTER</span>
                        </div>
                    </div>

                    {/* Formulário Central (Estilo Minimalista e Robusto) */}
                    <div className="my-auto max-w-md w-full mx-auto space-y-8">
                        <div className="space-y-2.5">
                            <h2 className="text-4xl font-outfit font-extrabold text-white tracking-tight leading-tight">
                                Welcome
                            </h2>
                            <p className="text-sm text-text-secondary">
                                Acesse sua conta no centro de inteligência e continue sua jornada conosco.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            {/* Input E-mail */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block">Endereço de E-mail</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input 
                                        type="email" 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        placeholder="seu@email.com" 
                                        required
                                        className="w-full bg-[#0d0d0d] border border-white/5 focus:border-primary/50 focus:bg-white/[0.02] rounded-2xl px-4 py-4 pl-12 text-sm outline-none transition-all placeholder:text-text-secondary/25 text-white font-medium shadow-sm" 
                                    />
                                </div>
                            </div>

                            {/* Input Senha */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block">Chave de Acesso</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input 
                                        type={showPass ? "text" : "password"} 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                        placeholder="••••••••" 
                                        required
                                        className="w-full bg-[#0d0d0d] border border-white/5 focus:border-primary/50 focus:bg-white/[0.02] rounded-2xl px-4 py-4 pl-12 pr-12 text-sm outline-none transition-all placeholder:text-text-secondary/25 text-white font-medium shadow-sm" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-foreground transition-colors cursor-pointer"
                                    >
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Erro */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -6 }} 
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        className="flex items-center gap-3 p-4 rounded-2xl bg-danger/10 border border-danger/20"
                                    >
                                        <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
                                        <p className="text-xs text-danger font-medium">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Botão de Entrar (Sólido & Elegante) */}
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-4 rounded-2xl bg-primary text-black font-extrabold text-sm hover:bg-primary-light transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/5 hover:shadow-primary/20 hover:-translate-y-0.5 cursor-pointer relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 skew-x-[-25deg] -translate-x-[150%] group-hover:translate-x-[250%] transition-transform duration-1000 ease-out" />
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                                        <span>Entrando na rede...</span>
                                    </>
                                ) : (
                                    <>
                                        <Fingerprint className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
                                        <span>Conectar na Plataforma</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-text-secondary/30 border-t border-white/5 pt-6 mt-8 w-full gap-2">
                        <p>DWS SCOUTER © 2026 · Antigravity Agency</p>
                        <p className="font-mono tracking-widest uppercase">CONEXÃO CRIPTOGRAFADA</p>
                    </div>
                </div>

                {/* ── LADO DIREITO: Painel de Telemetria e Visual Completo (Col 6) ────────────────── */}
                <div className="hidden lg:block lg:col-span-6 p-6 h-screen w-full relative z-20">
                    
                    {/* Visual Card com bordas arredondadas generosas inspiradas no layout de referência */}
                    <div className="h-full w-full rounded-[32px] relative overflow-hidden bg-[#0a0a0a] border border-white/5 shadow-2xl flex flex-col justify-between p-8 xl:p-12">
                        
                        {/* Fundo abstrato com malha de grades e gradientes coloridos dinâmicos (Semelhante à arte ondulada de referência) */}
                        <div className="absolute inset-0 z-0 opacity-40">
                            <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-purple-600/20 to-blue-500/20 blur-[130px]" />
                            <div className="absolute bottom-[10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-primary/10 to-red-500/10 blur-[130px]" />
                            
                            {/* Linha técnica sutil de grade no fundo visual */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:25px_25px]" />
                        </div>

                        {/* Top: Header do HUD Visual */}
                        <div className="flex items-center justify-between w-full relative z-10 border-b border-white/5 pb-4">
                            <span className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px] font-mono">
                                <Radar className="w-4 h-4 text-primary animate-pulse" /> Console de Varredura Ativa
                            </span>
                            <span className="flex items-center gap-1.5 text-[9px] bg-success/10 text-success px-3 py-1 rounded-full border border-success/20 font-bold font-mono">
                                <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" /> TELEMETRIA EM TEMPO REAL
                            </span>
                        </div>

                        {/* Center: Holografia do Radar Rotativo */}
                        <div className="my-auto flex flex-col items-center justify-center relative z-10 py-6">
                            <div className="relative w-64 h-64 flex items-center justify-center">
                                {/* Anéis concêntricos */}
                                <div className="absolute inset-0 rounded-full border border-primary/5 animate-pulse shadow-[0_0_50px_rgba(212,175,55,0.02)]" />
                                <div className="absolute w-[85%] h-[85%] rounded-full border border-white/5" />
                                <div className="absolute w-[65%] h-[65%] rounded-full border border-white/5" />
                                <div className="absolute w-[45%] h-[45%] rounded-full border border-white/5" />
                                <div className="absolute w-[25%] h-[25%] rounded-full border border-primary/20" />
                                
                                {/* Core Scouter central */}
                                <div className="absolute w-12 h-12 rounded-full bg-primary/10 border border-primary/35 flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.2)]">
                                    <Fingerprint className="w-6 h-6 text-primary animate-pulse" />
                                </div>

                                {/* Feixe rotativo em Framer Motion */}
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                                    className="absolute inset-0 pointer-events-none origin-center"
                                >
                                    <div className="w-1/2 h-1/2 bg-gradient-to-tr from-primary/0 via-primary/5 to-primary/25 rounded-tr-full origin-bottom-left absolute bottom-1/2 left-1/2" 
                                         style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }} />
                                    <div className="w-1/2 h-[1px] bg-primary/30 absolute top-1/2 left-1/2 origin-left" />
                                </motion.div>
                                
                                {/* Nós de modelo piscando */}
                                <div className="absolute top-[22%] left-[30%] w-2 h-2 rounded-full bg-success shadow-[0_0_12px_#30D158] animate-ping" />
                                <div className="absolute bottom-[28%] right-[25%] w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_#D4AF37] animate-pulse" />
                                <div className="absolute top-[60%] left-[20%] w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7] animate-pulse" />
                            </div>

                            {/* Mini log terminal de varredura flutuando sob o radar */}
                            <div className="w-full max-w-sm mt-8 space-y-2.5 font-mono text-[10px] bg-black/60 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
                                <div className="space-y-1.5 h-[96px] overflow-hidden">
                                    <AnimatePresence initial={false}>
                                        {telemetryLogs.map(l => (
                                            <motion.div 
                                                key={l.id} 
                                                initial={{ opacity: 0, y: -6 }} 
                                                animate={{ opacity: 1, y: 0 }} 
                                                exit={{ opacity: 0, y: 6 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.01] hover:bg-white/[0.02]"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-primary/60">scouter::</span>
                                                    <span className="text-white font-bold">{l.username}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "px-1 rounded-[4px] text-[7.5px] font-bold tracking-wider",
                                                        l.status === "MATCH" ? "bg-success/10 text-success" :
                                                        l.status === "LEAD SALVO" ? "bg-blue-500/10 text-blue-400" :
                                                        l.status === "COMPATÍVEL" ? "bg-purple-500/10 text-purple-400" : "bg-amber-500/10 text-amber-400"
                                                    )}>
                                                        {l.status} {l.status !== "VERIFICANDO" && l.score}
                                                    </span>
                                                    <span className="text-text-secondary/40 text-[8px] w-10 text-right">{l.time}</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Bottom: Cartão de Perfil Flutuante Sincronizado */}
                        <div className="relative z-10 w-full flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentLead.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.35 }}
                                    className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-center justify-between shadow-2xl relative group/card"
                                >
                                    {/* Informações da Modelo */}
                                    <div className="flex items-start gap-4">
                                        <div className="relative flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full overflow-hidden border border-white/15 bg-neutral-800">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img 
                                                    src={currentLead.avatar} 
                                                    alt={currentLead.name} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${currentLead.name}&background=D4AF37&color=fff`;
                                                    }}
                                                />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#050505] border border-white/10 flex items-center justify-center">
                                                <Award className="w-3 h-3 text-primary" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold text-white leading-none">{currentLead.name}</h4>
                                                <span className="text-[9px] font-bold text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 leading-none">
                                                    Match {currentLead.score}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-text-secondary/70 font-mono leading-none">{currentLead.username}</p>
                                            <p className="text-[10.5px] text-text-secondary/90 leading-relaxed font-medium pt-1">
                                                "{currentLead.desc}"
                                            </p>
                                        </div>
                                    </div>

                                    {/* Botão de Próximo */}
                                    <button 
                                        type="button"
                                        onClick={() => setLeadIndex(prev => (prev + 1) % SCANNED_LEADS.length)}
                                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center cursor-pointer text-white ml-4 flex-shrink-0 shadow-sm"
                                    >
                                        <ChevronRight className="w-4.5 h-4.5" />
                                    </button>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
