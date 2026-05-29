"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/context/AuthContext";

export default function LoginPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // If user is already authenticated, redirect them to dashboard
    useEffect(() => {
        if (!loading && user) {
            router.push("/dashboard");
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");
        setIsSubmitting(true);

        try {
            if (isSignUp) {
                // Supabase sign up
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin + "/dashboard",
                    }
                });

                if (error) throw error;

                if (data.user && data.session === null) {
                    setSuccessMsg("Conta criada com sucesso! Verifique seu e-mail para confirmação.");
                } else {
                    router.push("/dashboard");
                }
            } else {
                // Supabase sign in
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;
                router.push("/dashboard");
            }
        } catch (error: any) {
            console.error("Auth error:", error);
            setErrorMsg(error.message || "Ocorreu um erro no processo de autenticação.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || user) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-text-secondary">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-screen items-center justify-center bg-background overflow-hidden p-4">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10 space-y-8">
                {/* Logo & Title */}
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_30px_rgba(201,160,92,0.15)] mb-4">
                        <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                    </div>
                    <h1 className="text-3xl font-outfit font-extrabold tracking-tight text-white">
                        SMR RADAR
                    </h1>
                    <p className="text-xs text-text-secondary uppercase tracking-[0.25em] font-semibold">
                        Social Model Scouting Platform
                    </p>
                </div>

                {/* Form Card */}
                <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.5)] shadow-primary/5">
                    <h2 className="text-xl font-bold font-outfit text-white mb-6">
                        {isSignUp ? "Criar nova conta" : "Entrar na plataforma"}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Message */}
                        {errorMsg && (
                            <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold leading-relaxed">
                                {errorMsg}
                            </div>
                        )}

                        {/* Success Message */}
                        {successMsg && (
                            <div className="p-4 rounded-2xl bg-success/10 border border-success/20 text-success text-xs font-semibold leading-relaxed">
                                {successMsg}
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary px-1">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/60" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seuemail@exemplo.com"
                                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary px-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/60" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-text-secondary/40 focus:outline-none focus:border-primary/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary-light text-black text-sm font-extrabold hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>{isSignUp ? "Registrar Conta" : "Acessar Plataforma"}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle Mode Link */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setErrorMsg("");
                                setSuccessMsg("");
                            }}
                            className="text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
                        >
                            {isSignUp ? "Já tem uma conta? Faça Login" : "Não tem conta? Crie uma agora"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
