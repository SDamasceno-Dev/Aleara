import Link from 'next/link';

function Card({
  title,
  children,
  href,
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
}) {
  const body = (
    <div className='rounded-lg border border-border/60 bg-card/90 p-4 shadow-sm'>
      <h3 className='text-sm font-semibold'>{title}</h3>
      <div className='mt-3 text-sm text-zinc-300/90'>{children}</div>
    </div>
  );
  if (href) {
    return <Link href={href}>{body}</Link>;
  }
  return body;
}

export default function DashboardPage() {
  return (
    <div className='space-y-4'>
      <h1 className='text-xl font-semibold'>Dashboard</h1>
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card title='Mega-Sena • últimos resultados' href='/app/mega-sena'>
          <div className='flex items-center gap-2'>
            <span className='rounded-md bg-zinc-800 px-2 py-1'>
              Concurso 2673
            </span>
            <span>12 • 23 • 26 • 31 • 44 • 57</span>
          </div>
          <div className='mt-2 text-xs text-zinc-400'>Atualizado há 2h</div>
        </Card>
        <Card title='Suas apostas (Mega-Sena)' href='/app/apostas'>
          <div>3 apostas ativas • 1 premiada</div>
          <div className='mt-2 text-xs text-zinc-400'>Última: 10/11/2025</div>
        </Card>
        <Card title='Insights rápidos'>
          <ul className='list-disc pl-4'>
            <li>Números mais frequentes: 10, 23, 53</li>
            <li>Maior hiato: 37</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
