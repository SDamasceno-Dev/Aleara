import type { ButtonIntent, ButtonSize, ButtonVariant } from "./types";

export const sizeStyles: Record<ButtonSize, string> = {
	sm: "h-9 px-3 text-sm",
	md: "h-11 px-4 text-sm",
	lg: "h-12 px-5 text-base",
};

const solidByIntent: Record<ButtonIntent, string> = {
	primary: "bg-(--wine) text-white hover:opacity-95",
	secondary: "bg-zinc-800 text-white hover:opacity-95",
	gold: "btn-gold text-[#0e0e0e]",
	info: "bg-(--alertInfo) text-white hover:opacity-95",
	success: "bg-(--alertSuccess) text-white hover:opacity-95",
	warning: "bg-(--alertWarning) text-black hover:opacity-95",
	danger: "bg-red-600 text-white hover:opacity-95",
};

const outlineByIntent: Record<ButtonIntent, string> = {
	primary: "border border-(--wine) text-(--wine) hover:bg-(--wine) hover:text-white",
	secondary: "border border-zinc-700 text-zinc-900 hover:bg-zinc-800 hover:text-white",
	gold: "border border-(--gold-2) text-(--gold-2) hover:bg-(--gold-2) hover:text-black",
	info: "border border-(--alertInfo) text-(--alertInfo) hover:bg-(--alertInfo) hover:text-white",
	success: "border border-(--alertSuccess) text-(--alertSuccess) hover:bg-(--alertSuccess) hover:text-white",
	warning: "border border-(--alertWarning) text-(--alertWarning) hover:bg-(--alertWarning) hover:text-black",
	danger: "border border-red-600 text-red-600 hover:bg-red-600 hover:text-white",
};

const ghostByIntent: Record<ButtonIntent, string> = {
	primary: "text-(--wine) hover:bg-(--wine)/10",
	secondary: "text-zinc-900 hover:bg-zinc-800/10",
	gold: "text-(--gold-2) hover:bg-(--gold-2)/10",
	info: "text-(--alertInfo) hover:bg-(--alertInfo)/10",
	success: "text-(--alertSuccess) hover:bg-(--alertSuccess)/10",
	warning: "text-(--alertWarning) hover:bg-(--alertWarning)/10",
	danger: "text-red-600 hover:bg-red-600/10",
};

export function getVariantStyles(variant: ButtonVariant, intent: ButtonIntent): string {
	if (variant === "outline") return outlineByIntent[intent];
	if (variant === "ghost") return ghostByIntent[intent];
	return solidByIntent[intent];
}

export const baseButton =
	"inline-flex items-center justify-center gap-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) disabled:opacity-60 disabled:cursor-not-allowed";


