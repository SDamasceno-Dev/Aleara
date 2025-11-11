import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "solid" | "outline" | "ghost";
export type ButtonIntent = "primary" | "secondary" | "gold" | "info" | "success" | "warning" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
	intent?: ButtonIntent;
	size?: ButtonSize;
	leftIcon?: ReactNode;
	className?: string;
};


