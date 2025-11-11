"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { DialogContextValue, DialogIntent, DialogOpenInput, DialogState } from "./types";
import { dialogContainer, dialogHeaderBar, dialogOverlay, intentStyles } from "./styles";

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
	const ctx = useContext(DialogContext);
	if (!ctx) {
		throw new Error("useDialog must be used within DialogProvider");
	}
	return ctx;
}

export function DialogProvider({ children }: { children: React.ReactNode }): React.ReactElement {
	const [state, setState] = useState<DialogState>({ open: false, intent: "message" });

	function close() {
		setState((s) => ({ ...s, open: false }));
		state.onClose?.();
	}

	function open(input: DialogOpenInput) {
		setState({ open: true, intent: input.intent, title: input.title, description: input.description, actions: input.actions, onClose: input.onClose });
	}

	useEffect(() => {
		if (state.open) {
			const prev = document.body.style.overflow;
			document.body.style.overflow = "hidden";
			return () => {
				document.body.style.overflow = prev;
			};
		}
	}, [state.open]);

	const value = useMemo(() => ({ open, close }), [open, close]);

	return (
		<DialogContext.Provider value={value}>
			{children}
			<DialogRoot state={state} close={close} />
		</DialogContext.Provider>
	);
}

function DialogRoot({ state, close }: { state: DialogState; close: () => void }) {
	if (typeof document === "undefined") return null;
	if (!state.open) return null;

	const styles = intentStyles[state.intent as DialogIntent];

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* overlay */}
			<button aria-label="Fechar" onClick={close} className={dialogOverlay} />
			{/* content */}
			<div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className={`${dialogContainer} ${styles.border}`}>
				<div className={`${dialogHeaderBar} ${styles.headerBg}`}>
					<h2 id="dialog-title" className="text-xs font-semibold tracking-widest">AVISO</h2>
					<button onClick={close} className="absolute right-2 top-1.5 rounded-md p-1 text-white/90 hover:bg-white/15" aria-label="Fechar diálogo">
						<svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
							<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
						</svg>
					</button>
				</div>
				<div className="px-5 py-4 text-sm text-zinc-700">{typeof state.description === "string" ? <p>{state.description}</p> : state.description}</div>
			</div>
		</div>,
		document.body
	);
}

export * from "./types";


