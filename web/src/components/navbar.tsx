import Link from "next/link";

export function Navbar() {
	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur">
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
				<Link href="/" className="inline-flex items-center gap-2">
					<span className="inline-block h-6 w-6 rounded-md bg-primary" />
					<span className="text-base font-semibold tracking-tight">Aleara</span>
				</Link>
				<nav className="flex items-center gap-3">
					<Link
						href="#features"
						className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground md:inline-block"
					>
						Recursos
					</Link>
					<Link
						href="#precos"
						className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground md:inline-block"
					>
						Preços
					</Link>
					<Link
						href="/entrar"
						className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
					>
						Entrar
					</Link>
					<Link
						href="/criar-conta"
						className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
					>
						Comece grátis
					</Link>
				</nav>
			</div>
		</header>
	);
}


