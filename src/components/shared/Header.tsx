"use client";

import {
    Search,
    Bell,
    Plus,
    Filter,
    Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
    title: string;
    subtitle?: string;
    showActions?: boolean;
}

export function Header({ title, subtitle, showActions = true }: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 px-8 py-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-outfit font-bold">{title}</h2>
                    {subtitle && (
                        <p className="text-sm text-text-secondary">{subtitle}</p>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar modelos, perfis..."
                            className="bg-card border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm w-64 focus:outline-none focus:border-primary/50 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                        <button className="p-2 rounded-full hover:bg-white/5 text-text-secondary hover:text-foreground transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
                        </button>

                        {showActions && (
                            <button className="flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
                                <Plus className="w-4 h-4" />
                                <span>Captar Modelos</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
