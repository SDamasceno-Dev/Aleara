export function Footer() {
	const year = new Date().getFullYear();
	return (
		<footer className="border-t border-border/60 bg-background">
			<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 text-sm text-muted-foreground">
				<p>© {year} Aleara. Todos os direitos reservados.</p>
				<div className="flex items-center gap-4">
					<a className="hover:text-foreground" href="#privacidade">
						Privacidade
					</a>
					<a className="hover:text-foreground" href="#termos">
						Termos
					</a>
				</div>
			</div>
		</footer>
	);
}


