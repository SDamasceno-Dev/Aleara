export const metadata = {
  title: 'Sobre • Aleara',
  description: 'Conheça a plataforma Aleara.',
};

export default function SobrePage() {
  return (
    <div className='relative min-h-full overflow-x-hidden'>
      <main className='relative z-10 mx-auto w-full max-w-3xl px-4 py-20'>
        <section className='space-y-4 text-center'>
          <h1 className='text-3xl font-semibold tracking-tight text-foreground'>
            Sobre a Aleara
          </h1>
          <p className='mx-auto max-w-2xl text-balance text-zinc-300/90'>
            A Aleara é uma plataforma SaaS moderna e eficiente para acelerar o
            lançamento de produtos digitais, com foco em design consistente,
            performance e experiência de uso.
          </p>
        </section>

        <section className='mt-10 grid gap-4 md:grid-cols-3'>
          {[
            { t: 'Design', d: 'Sistema de design coeso e acessível.' },
            { t: 'Performance', d: 'Next.js 16 e otimizações nativas.' },
            { t: 'Escala', d: 'Arquitetura preparada para crescer.' },
          ].map((f) => (
            <div
              key={f.t}
              className='rounded-lg border border-border/70 bg-card/80 p-5'
            >
              <h3 className='text-base font-semibold'>{f.t}</h3>
              <p className='mt-2 text-sm text-zinc-300/80'>{f.d}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
