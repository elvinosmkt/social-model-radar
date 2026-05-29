"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, Loader2, AlertCircle, Shield, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/context/AuthContext";

// ── Mock users com hierarquia correta ────────────────────────────
const MOCK_USERS = [
    { email: "admin@dwsscouter.com",     password: "admin123",    role: "admin",      name: "Administrador",  redirect: "/admin"    },
    { email: "carlos@dwsscouter.com",    password: "vendedor123", role: "vendedor",   name: "Carlos Mendes",  redirect: "/vendedor" },
    { email: "rafaela@dwsscouter.com",   password: "scout123",    role: "webscouter", name: "Rafaela Costa",  redirect: "/dashboard" },
];

const ROLE_DEMOS = [
    { role: "admin",      label: "ADM",        email: "admin@dwsscouter.com",   password: "admin123",    icon: Shield,   color: "bg-primary/10 border-primary/20 text-primary",      desc: "Acesso total + gestão de vendedores" },
    { role: "vendedor",   label: "VENDEDOR",   email: "carlos@dwsscouter.com",  password: "vendedor123", icon: Briefcase,color: "bg-blue-500/10 border-blue-500/20 text-blue-400",   desc: "Gerencia equipe e distribui créditos" },
    { role: "webscouter", label: "WEBSCOUTER", email: "rafaela@dwsscouter.com", password: "scout123",    icon: Zap,      color: "bg-purple-500/10 border-purple-500/20 text-purple-400", desc: "Captação e abordagem de leads" },
];

export default function LoginPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // If user is already authenticated (via Supabase), redirect to dashboard
    useEffect(() => {
        if (!authLoading && user) {
            router.push("/dashboard");
        }
    }, [user, authLoading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // 1. Check if mock user matches
        const matchedMock = MOCK_USERS.find(u => u.email === email && u.password === password);
        if (matchedMock) {
            await new Promise(r => setTimeout(r, 800));
            router.push(matchedMock.redirect);
            return;
        }

        // 2. Fallback to Supabase Auth
        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (authError) throw authError;

            // Fetch role from Supabase public.users table
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
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-text-secondary font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
            {/* Fundo decorativo */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl" />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="relative w-full max-w-md px-6">
                <div className="glass-effect rounded-3xl p-10 border border-white/8 shadow-2xl">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.4)] mb-4">
                            <Zap className="w-7 h-7 text-black" />
                        </div>
                        <h1 className="text-2xl font-outfit font-bold premium-gradient-text tracking-tight animate-pulse">DWS SCOUTER</h1>
                        <p className="text-xs text-text-secondary uppercase tracking-[0.2em] mt-1 font-semibold">Digital Web Scouter</p>
                    </div>

                    {/* Hierarquia visual */}
                    <div className="flex items-center justify-center gap-2 mb-6 text-[10px] font-bold">
                        <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">ADM</span>
                        <span className="text-white/20">›</span>
                        <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">VENDEDOR</span>
                        <span className="text-white/20">›</span>
                        <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">WEBSCOUTER</span>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">E-mail</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
                                className="w-full bg-white/5 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-text-secondary/40 text-white font-medium" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">Senha</label>
                            <div className="relative">
                                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                                    className="w-full bg-white/5 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-all placeholder:text-text-secondary/40 text-white font-medium" />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-foreground transition-colors">
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <p className="text-xs text-red-400 font-medium">{error}</p>
                            </motion.div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-primary text-black font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Entrando…</> : "Entrar na Plataforma"}
                        </button>
                    </form>

                    {/* Demo roles */}
                    <div className="mt-8 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary text-center">Acessos de Demonstração</p>
                        <div className="space-y-2">
                            {ROLE_DEMOS.map(d => (
                                <button key={d.role} onClick={() => { setEmail(d.email); setPassword(d.password); }}
                                    className={cn("w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:opacity-90 text-left", d.color)}>
                                    <d.icon className="w-4 h-4 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-wider">{d.label}</p>
                                        <p className="text-[10px] opacity-70 truncate">{d.desc}</p>
                                    </div>
                                    <span className="text-[10px] opacity-60 font-mono flex-shrink-0">clique p/ preencher</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="text-center text-[11px] text-text-secondary mt-6">DWS SCOUTER © 2025 · Antigravity Agency</p>
            </motion.div>
        </div>
    );
}
