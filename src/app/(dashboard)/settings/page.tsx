"use client";

import { useState } from "react";
import { Header } from "@/components/shared/Header";
import { 
    User, 
    Lock, 
    Sliders, 
    Database, 
    Save, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    Eye,
    EyeOff
} from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { userService } from "@/services/user-service";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const { user } = useAuth();
    
    // User profile state
    const [role, setRole] = useState("webscouter");
    const [fullName, setFullName] = useState("");

    // Fetch user profile dynamically
    useEffect(() => {
        if (user) {
            userService.getUserProfile(user.id).then(profile => {
                if (profile) {
                    setRole(profile.role);
                    setFullName(profile.nome);
                }
            });
        }
    }, [user]);

    // States for Password Reset
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // States for Scouting settings
    const [defaultNiche, setDefaultNiche] = useState("Fashion");
    const [maxCandidates, setMaxCandidates] = useState(20);
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);
    const [prefsSuccess, setPrefsSuccess] = useState(false);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError("");
        setPasswordSuccess("");

        if (password.length < 6) {
            setPasswordError("A senha precisa ter no mínimo 6 caracteres.");
            return;
        }

        if (password !== confirmPassword) {
            setPasswordError("As senhas não coincidem.");
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setPasswordSuccess("Sua senha foi atualizada com sucesso!");
            setPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Password update error:", error);
            setPasswordError(error.message || "Erro ao atualizar a senha.");
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleSavePrefs = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingPrefs(true);
        setPrefsSuccess(false);

        // Simulate local preference saving
        setTimeout(() => {
            setIsSavingPrefs(false);
            setPrefsSuccess(true);
            setTimeout(() => setPrefsSuccess(false), 3000);
        }, 800);
    };

    // Get email and display username
    const email = user?.email || "usuario@exemplo.com";
    const username = email.split('@')[0];
    const createdAt = user?.created_at 
        ? new Date(user.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: 'long', year: 'numeric' })
        : "N/A";

    return (
        <div className="flex flex-col h-screen bg-background">
            <Header
                title="Configurações"
                subtitle="Gerencie sua conta, chaves de API e preferências do Radar."
            />

            <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto no-scrollbar">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Left Column: Navigation / Info */}
                    <div className="md:col-span-1 space-y-6">
                        {/* Profile Info Card */}
                        <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 p-0.5 shadow-[0_0_30px_rgba(201,160,92,0.2)]">
                                <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-2xl font-extrabold text-primary uppercase">
                                    {(fullName || username).slice(0, 2)}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-outfit font-bold text-lg text-white capitalize">{fullName || username}</h3>
                                <p className="text-xs text-text-secondary">{email}</p>
                            </div>
                            <div className="w-full pt-4 border-t border-white/[0.05] text-left space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-text-secondary/70">Membro desde:</span>
                                    <span className="font-semibold text-white">{createdAt}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary/70">Nível de Acesso:</span>
                                    <span className={cn(
                                        "font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md border",
                                        role === 'admin' ? "text-primary bg-primary/10 border-primary/20" :
                                        role === 'vendedor' ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                                        "text-purple-400 bg-purple-500/10 border-purple-500/20"
                                    )}>{role}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick API Status Card */}
                        <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                                <Database className="w-4 h-4 text-primary" /> Status do Sistema
                            </h4>
                            <div className="space-y-3 text-xs">
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.02]">
                                    <span className="text-text-secondary">OpenAI GPT-4o</span>
                                    <span className="flex items-center gap-1.5 font-bold text-success">
                                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" /> Ativo
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.02]">
                                    <span className="text-text-secondary">Apify Scraper</span>
                                    <span className="flex items-center gap-1.5 font-bold text-success">
                                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" /> Ativo
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.01] border border-white/[0.02]">
                                    <span className="text-text-secondary">Supabase DB</span>
                                    <span className="flex items-center gap-1.5 font-bold text-success">
                                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" /> Conectado
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Settings Forms */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Scouting Preferences Form */}
                        <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                                    <Sliders className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-outfit font-bold text-lg text-white">Preferências do Radar</h3>
                                    <p className="text-xs text-text-secondary">Defina as opções padrões usadas nas buscas de IA.</p>
                                </div>
                            </div>

                            <form onSubmit={handleSavePrefs} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary px-1">Nicho Padrão</label>
                                        <select
                                            value={defaultNiche}
                                            onChange={(e) => setDefaultNiche(e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-medium appearance-none"
                                        >
                                            <option value="Fashion">Moda / Fashion</option>
                                            <option value="Beauty">Beleza / Beauty</option>
                                            <option value="Lifestyle">Estilo de Vida / Lifestyle</option>
                                            <option value="Fitness">Saúde / Fitness</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary px-1">Candidatos por Busca</label>
                                        <input
                                            type="number"
                                            min="5"
                                            max="50"
                                            value={maxCandidates}
                                            onChange={(e) => setMaxCandidates(Number(e.target.value))}
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    {prefsSuccess ? (
                                        <span className="flex items-center gap-1 text-xs font-semibold text-success">
                                            <CheckCircle2 className="w-4 h-4" /> Preferências salvas!
                                        </span>
                                    ) : <div />}
                                    
                                    <button
                                        type="submit"
                                        disabled={isSavingPrefs}
                                        className="py-2.5 px-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-gradient-to-r hover:from-primary hover:to-primary-light hover:text-black hover:border-transparent transition-all duration-300 text-xs font-bold flex items-center gap-2 text-white"
                                    >
                                        {isSavingPrefs ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span>Salvar Preferências</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Security / Password Form */}
                        <div className="backdrop-blur-md bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-outfit font-bold text-lg text-white">Segurança e Acesso</h3>
                                    <p className="text-xs text-text-secondary">Atualize sua senha de acesso ao painel com segurança.</p>
                                </div>
                            </div>

                            <form onSubmit={handlePasswordReset} className="space-y-4">
                                {passwordError && (
                                    <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold flex items-center gap-2 leading-relaxed">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{passwordError}</span>
                                    </div>
                                )}

                                {passwordSuccess && (
                                    <div className="p-4 rounded-2xl bg-success/10 border border-success/20 text-success text-xs font-semibold flex items-center gap-2 leading-relaxed">
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                        <span>{passwordSuccess}</span>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary px-1">Nova Senha</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-3 px-4 pr-12 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-medium placeholder:text-text-secondary/30"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary/50 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary px-1">Confirmar Nova Senha</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repita a nova senha"
                                        className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-medium placeholder:text-text-secondary/30"
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={isUpdatingPassword}
                                        className="py-2.5 px-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-gradient-to-r hover:from-primary hover:to-primary-light hover:text-black hover:border-transparent transition-all duration-300 text-xs font-bold flex items-center gap-2 text-white"
                                    >
                                        {isUpdatingPassword ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Lock className="w-4 h-4" />
                                                <span>Atualizar Senha</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
