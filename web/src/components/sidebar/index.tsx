"use client";

import Link from "next/link";
import { Home, TicketPercent, History, Settings, LogOut, Gauge } from "lucide-react";

const itemBase =
	"flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-300/90 hover:text-white hover:bg-white/10 transition-colors";

export function Sidebar() {
	return (
		<aside className="hidden w-56 shrink-0 self-stretch border-r border-white/10 bg-black/20 p-2 backdrop-blur md:flex md:flex-col">
			<nav className="flex min-h-0 flex-1 flex-col">
				<div className="space-y-1">
					<Link href="/app" className={itemBase}>
						<Home className="h-4 w-4" /> Visão geral
					</Link>
					<div className="mt-3 text-xs uppercase tracking-wide text-zinc-500">Loterias</div>
					<Link href="/app/mega-sena" className={itemBase}>
						<Gauge className="h-4 w-4" /> Mega-Sena
					</Link>
				</div>
				<div className="mt-6 space-y-1">
					<Link href="/app/apostas" className={itemBase}>
						<TicketPercent className="h-4 w-4" /> Apostas
					</Link>
					<Link href="/app/historico" className={itemBase}>
						<History className="h-4 w-4" /> Histórico
					</Link>
					<Link href="/app/configuracoes" className={itemBase}>
						<Settings className="h-4 w-4" /> Configurações
					</Link>
				</div>
				<div className="mt-auto pt-2">
					<button
						type="button"
						onClick={() => {
							try {
								if (typeof window !== "undefined") {
									localStorage.removeItem("auth");
									document.cookie = "auth=; Max-Age=0; path=/; SameSite=Lax";
								}
							} catch {}
							window.location.href = "/";
						}}
						className={`${itemBase} w-full`}
					>
						<LogOut className="h-4 w-4" /> Sair do app
					</button>
				</div>
			</nav>
		</aside>
	);
}


