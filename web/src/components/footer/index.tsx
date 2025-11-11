import { footerContainer, footerLink, footerRoot } from "./styles";
import type { FooterProps } from "./types";

export function Footer({ className }: FooterProps) {
	return (
		<footer className={`${footerRoot} ${className ?? ""}`.trim()}>
			<div className={footerContainer}>
				<p>© 2025 Aleara. Todos os direitos reservados.</p>
				<div className="flex items-center gap-4">
					<a className={footerLink} href="/privacidade">
						Privacidade
					</a>
					<a className={footerLink} href="/termos">
						Termos
					</a>
				</div>
			</div>
		</footer>
	);
}


