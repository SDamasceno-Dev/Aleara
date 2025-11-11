import Image from "next/image";
import prismUrl from "@assets/prism.svg?url";

export const metadata = {
	title: "Privacidade • Aleara",
	description: "Política de Privacidade da plataforma Aleara.",
};

export default function PrivacidadePage() {
	return (
		<div className="relative min-h-full overflow-x-hidden">

			<main className="relative z-10 mx-auto w-full max-w-3xl px-4 py-16">
				<div className="flex flex-col items-center text-center">
					<Image src={prismUrl} alt="Aleara" width={72} height={72} priority />
					<h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
						Política de Privacidade
					</h1>
				</div>

				<section className="mt-6 rounded-md border border-border bg-white/95 p-5 text-sm leading-6 text-zinc-800 shadow-sm">
					<p>
						Este é um espaço reservado para o conteúdo da sua Política de Privacidade.
						Descreva como coletamos, utilizamos e protegemos seus dados, bem como as
						suas preferências de controle e contato.
					</p>
				</section>
			</main>
		</div>
	);
}


