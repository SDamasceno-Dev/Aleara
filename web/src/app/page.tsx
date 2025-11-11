import Link from "next/link";
import Image from "next/image";
import { GoogleIcon } from "@/components/icons";

export default function Home() {
	return (
		<div className="relative flex min-h-dvh items-center justify-center overflow-hidden">
			{/* Background layers */}
			<div aria-hidden className="login-bg" />
			<div aria-hidden className="login-aurora" />
			<div aria-hidden className="prism-lines" />

			{/* Content */}
			<div className="relative z-10 mx-auto w-full max-w-md px-4 py-10">
				<div className="mb-8 flex flex-col items-center justify-center gap-3 text-center">
					<Image
						src="/prism.svg"
						alt="Aleara"
						width={256}
						height={256}
						priority
					/>
					<p className="text-sm text-zinc-300/80">Acesso exclusivo para membros</p>
				</div>

				<form className="space-y-4">
					<div className="glass-dark input-frame input-gold rounded-md px-3 py-2">
						<input
							type="email"
							name="email"
							placeholder="E-mail"
							className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-400/70 focus:outline-none"
							autoComplete="email"
							required
						/>
					</div>
					<div className="glass-dark input-frame input-gold rounded-md px-3 py-2">
						<input
							type="password"
							name="password"
							placeholder="Senha"
							className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-400/70 focus:outline-none"
							autoComplete="current-password"
							required
						/>
					</div>

					<div className="flex justify-center">
						<Link
							href="#"
							className="text-xs text-zinc-300/80 underline-offset-4 hover:underline"
						>
							Esqueceu sua senha?
						</Link>
					</div>

					<button
						type="submit"
						className="btn-gold mt-1 inline-flex h-11 w-full items-center justify-center rounded-md text-sm font-medium"
					>
						Entrar
					</button>
				</form>

				<div className="my-6 flex items-center gap-3 text-xs text-zinc-400/80">
					<div className="h-px flex-1 bg-white/10" />
					<span>ou</span>
					<div className="h-px flex-1 bg-white/10" />
				</div>

				<div className="space-y-3">
					<button
						type="button"
						className="glass-dark inline-flex h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-white/5"
					>
						<GoogleIcon className="h-4 w-4" />
						<span>Continuar com Google</span>
					</button>
				</div>
			</div>
		</div>
	);
}
