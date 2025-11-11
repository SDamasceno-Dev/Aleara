import { Button } from "@/components/button";

export const metadata = {
	title: "Planos • Aleara",
	description: "Escolha o plano ideal para o seu projeto.",
};

const plans = [
	{
		name: "Starter",
		price: "R$ 0",
		desc: "Ideal para validar ideias.",
		features: ["Até 1 projeto", "Deploy instantâneo", "Suporte comunitário"],
		intent: "secondary" as const,
	},
	{
		name: "Pro",
		price: "R$ 79/mês",
		desc: "Recursos para crescer com segurança.",
		features: ["Projetos ilimitados", "Logs e métricas", "Suporte prioritário"],
		intent: "gold" as const,
	},
	{
		name: "Enterprise",
		price: "Sob consulta",
		desc: "Customização e SLAs dedicados.",
		features: ["SLA empresarial", "SAML/SSO", "Suporte dedicado"],
		intent: "primary" as const,
	},
];

export default function PlanosPage() {
	return (
		<div className="relative min-h-full overflow-x-hidden">
			<main className="relative z-10 mx-auto w-full max-w-5xl px-4 py-20">
				<header className="text-center">
					<h1 className="text-3xl font-semibold tracking-tight text-foreground">Planos e aquisição</h1>
					<p className="mx-auto mt-2 max-w-2xl text-zinc-300/90">
						Escolha o plano que melhor se adapta ao seu momento. Você pode mudar a qualquer hora.
					</p>
				</header>
				<section className="mt-10 grid gap-4 md:grid-cols-3">
					{plans.map((p) => (
						<div key={p.name} className="rounded-lg border border-border/70 bg-card/80 p-6">
							<h3 className="text-lg font-semibold">{p.name}</h3>
							<p className="mt-1 text-sm text-zinc-300/80">{p.desc}</p>
							<div className="mt-4 text-2xl font-semibold">{p.price}</div>
							<ul className="mt-4 space-y-2 text-sm text-zinc-300/80">
								{p.features.map((f) => (
									<li key={f}>• {f}</li>
								))}
							</ul>
							<div className="mt-6">
								<Button intent={p.intent} className="w-full">
									Assinar
								</Button>
							</div>
						</div>
					))}
				</section>
			</main>
		</div>
	);
}


