# Baseline técnico

Inspeção: 08/09/2026, `development` em `0c1a310`. Versão do aplicativo: **0.11.1**. Produção foi relatada como validada por Sandro na mesma data; o registro está em [decisões](decisoes.md#release-de-segurança-0111).

## Stack observada

Versões resolvidas no [lockfile](../web/package-lock.json), não apenas intervalos do [package.json](../web/package.json):

| Área | Baseline |
| --- | --- |
| Aplicação | Next.js 16.3.3, React/React DOM 19.2.1, TypeScript 5.9.3 |
| Interface | Tailwind CSS 4.1.18; componentes e estilos em `web/src/components` |
| Dados e autenticação | Supabase JS 2.89.0, Supabase SSR 0.5.2; SQL/PostgreSQL em `web/supabase/migrations` |
| PDF | React PDF 4.3.1; Puppeteer Core 24.34.0 e Sparticuz Chromium 141.0.0 |
| Componentes isolados | Storybook 10.1.10; addons declarados não comprovam testes ativos |
| Instalação | npm, lockfile versionado e `npm ci` no CI; manifesto e lockfile declaram `engines.node` como `24.x`; sem `packageManager` |
| Runtime | Node 24 validado localmente (24.20.0), em Preview e em produção (`b12c5ea`); CI alinhado em Node 24. Vercel Project Setting atualizado para 24.x, com override/alerta anterior eliminado; `development` sincronizada em `497550e`. Evidências e limites no [fechamento da migração](decisoes.md#migração-node-20--24) |

`@types/node` permanece na linha 20 porque representa tipagem, não seleção do runtime, e a validação não demonstrou incompatibilidade que justificasse sua atualização.

## Mapa do sistema

| Caminho | Responsabilidade observada |
| --- | --- |
| [web/src/app](../web/src/app) | App Router: páginas, layouts, autenticação e handlers HTTP |
| [web/src/app/app](../web/src/app/app) | Área autenticada, administração e telas por modalidade |
| [web/src/app/api/loterias](../web/src/app/api/loterias) | Importações, estatísticas, geração de combinações, conjuntos, apostas, conferências e relatórios |
| [web/src/lib/supabase](../web/src/lib/supabase) | Clientes browser, server e administrativo |
| [web/supabase/migrations](../web/supabase/migrations) | Esquemas, constraints e policies versionadas; estado aplicado precisa de conferência externa |
| [web/src/components](../web/src/components) | Interface compartilhada; documentação local preservada |

Mega-Sena, Quina, Lotomania e Lotofácil possuem endpoints de domínio. A existência de páginas para outras modalidades não comprova equivalência funcional. Sorteios, conjuntos de jogos, itens, listas de apostas e conferências aparecem nas rotas e migrations. Regras de domínio estão distribuídas entre handlers, telas e SQL; não há aqui uma nova arquitetura aprovada.

O [PDF de relatórios da Mega-Sena](../web/src/app/api/loterias/mega-sena/reports/pdf/route.ts) usa Puppeteer/Chromium e busca um executável local como alternativa. React PDF também consta no projeto; manter ambos não constitui decisão de arquitetura futura. As duas rotas PDF compilaram no build local sob Node 24.20.0. Durante a validação, Sandro relatou falha na exportação PDF da Mega-Sena tanto no ambiente anterior Node 20 quanto no Node 24: comportamento pré-existente, não regressão da migração. A causa e os limites efetivos ainda precisam de investigação em [PEN-08](pendencias.md), separadamente.

## Ambiente e qualidade

[env.ts](../web/src/env.ts), [env-client.ts](../web/src/env-client.ts) e [check-env.mjs](../web/scripts/check-env.mjs) são referências para os nomes e verificações de variáveis. A chave de service role é administrativa e deve permanecer no servidor; valores de credenciais não devem entrar em documentação ou logs. `SITE_URL`/`NEXT_PUBLIC_SITE_URL` define a URL do ambiente, e o reenvio de convite exige sua configuração em produção. A orientação antiga de copiar variáveis da Vercel exige revisão antes de uso, conforme [pendências documentais](pendencias.md#documentação-existente-a-revisar).

O [CI](../.github/workflows/ci.yml) executa, em PRs para `development` e `main` e por disparo manual, jobs separados de build, ESLint sem warnings e TypeScript, todos sob Node 24. Usa variáveis substitutas para build, o que não valida integração real com Supabase. O [Release Please](../.github/workflows/release-please.yml) reage a pushes na `main`.

A validação local da migração em 08/09/2026 usou Node 24.20.0 e concluiu `npm ci`, TypeScript, ESLint sobre o conteúdo versionado e build de produção com Webpack. O build padrão com Turbopack não pôde ser concluído naquele ambiente porque a execução bloqueou a criação de processo com porta local; esse limite da validação local permanece registrado. Posteriormente, Sandro confirmou validação em Preview e smoke test aprovado em produção (`b12c5ea`), com CI alinhado em Node 24 e Vercel Project Setting em 24.x, sem o override/alerta anterior. O teste real de exportação PDF da Mega-Sena falhou nos dois runtimes, conforme registrado acima; o aceite da migração não equivale à validação funcional do PDF.

Não foi encontrada suíte automatizada dedicada ao domínio na inspeção; o manifesto não oferece script `test`. Stories e addons não equivalem a cobertura de domínio ou E2E. Os relatos de validação em Preview e produção não comprovam cobertura funcional ou de integração externa integral. Os resultados históricos de segurança são registrados separadamente e não representam uma nova execução.

## Referências existentes preservadas

- [Configuração de ambiente](../web/ENV_SETUP.md): referência antiga, com ressalvas pendentes.
- [Supabase](../web/supabase/README.md) e [convenção de migrations](../web/supabase/migrations/README.md): manter o detalhamento local; revisar o caminho antigo de migration no primeiro guia.
- Componentes: [Dialog](../web/src/components/dialog/README.md), [Footer](../web/src/components/footer/README.md), [Icons](../web/src/components/icons/README.md) e [Navbar](../web/src/components/navbar/README.md).
- [Levantamento de Lotomania](../web/docs/LOTOMANIA_IMPLEMENTATION.md): planejamento histórico, não especificação validada.
- [Changelog gerado](../web/web/CHANGELOG.md): histórico de versões, sem duplicar seu conteúdo nesta pasta.
