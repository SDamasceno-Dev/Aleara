import type { DialogIntent } from "./types";

export const dialogOverlay =
	"absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity";

export const dialogContainer =
	"relative z-10 w-full max-w-md rounded-xl border bg-white p-0 shadow-2xl";

export const dialogHeader =
	"flex items-center justify-between gap-3 rounded-t-xl border-b border-black/5 px-5 py-4";

export const dialogFooter =
	"flex items-center justify-end gap-2 border-t border-black/5 px-5 py-3";

export const badgeBase = "inline-flex h-6 items-center rounded-md px-2 text-xs font-medium";

export const intentStyles: Record<DialogIntent, { badge: string; border: string; label: string }> = {
	alert: {
		badge: `${badgeBase} bg-red-500/90 text-white`,
		border: "border-red-500",
		label: "Alerta",
	},
	warning: {
		badge: `${badgeBase} bg-amber-500/90 text-black`,
		border: "border-amber-500",
		label: "Aviso",
	},
	message: {
		badge: `${badgeBase} bg-[#2b0a0e]/90 text-white`,
		border: "border-(--wine)",
		label: "Mensagem",
	},
};


