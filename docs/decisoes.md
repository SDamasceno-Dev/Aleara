# Decisões e estados

Registro consolidado em 08/09/2026 a partir da conversa identificada no [índice](README.md) e do Git local. Mudanças relevantes exigem decisão de Sandro; o mentor recomenda e o Codex implementa no escopo aprovado.

## Estados de trabalho

| Estado | Significado |
| --- | --- |
| Proposto | Candidato ou hipótese de solução; não autoriza implementação |
| Aprovado | Sandro aceitou objetivo, limites e comportamento; execução ainda pode estar pendente |
| Implementado | Mudança entregue no escopo identificado; não implica deploy ou validação em produção |
| Validado | Critérios conferidos com evidência; indicar se local, Preview ou produção |
| Adiado | Decisão consciente de não executar agora; registrar motivo e condição de retomada |

Fluxo usual: Proposto → Aprovado → Implementado → Validado. Adiado não significa rejeitado. Um item aberto não é automaticamente Adiado, e uma decisão vigente não precisa ser rotulada como implementação de código.

## Registro de decisões

| ID | Decisão | Estado e evidência/limite |
| --- | --- | --- |
| DEC-01 | Convites e reenvios são exclusivos de ADMIN autenticado; reutilizar `is_admin()` antes da API administrativa | Validado em produção no ciclo SEC-02; aprovação explícita de Sandro no histórico |
| DEC-02 | Patch de segurança limitado a SEC-01..SEC-04, sem upgrade de Node, schema/RLS ou refatoração ampla de autenticação | Validado em produção na release 0.11.1 |
| DEC-03 | `main` é produção; `development` é integração; branches de trabalho são temporárias; archive é excepcional | Aprovado e aplicado na higiene Git de 08/09; [fluxo e fotografia](git-release.md) |
| DEC-04 | Economizar contexto, não validação; Codex verifica aspectos técnicos, Sandro verifica fluxos e aparência, mentor orienta e revisa | Aprovado e vigente; [regras](agentes.md) |
| DEC-05 | Git mecânico e previsível em blocos completos; operações ambíguas ou destrutivas exigem análise prévia | Aprovado; sem `cd` e `echo` nos blocos para o terminal já aberto na raiz, com `--no-pager` quando aplicável |
| DEC-06 | Manter fonte de verdade enxuta e versionada em `docs/`, distinguindo evidência, decisões e hipóteses | Aprovado; estrutura inicial Implementada nesta entrega, aguardando revisão editorial |
| DEC-07 | Adotar Node 24 no manifesto e no CI, sem modernizar dependências ou alterar `@types/node` sem necessidade demonstrada | Implementado e validado localmente em `development` com Node 24.20.0; Preview e promoção para produção permanecem pendentes |
| DEC-08 | Preservar `archive/zdd-worktree-2026-09-08` até revisão dos commits exclusivos | Preservação Implementada; destinação final Adiada até comparar o trabalho exclusivo |

## Release de segurança 0.11.1

**SEC-01 a SEC-04: Validado em produção**, conforme fechamento explícito do ciclo na conversa e confirmação de Sandro em 08/09/2026. Esse é um registro histórico de aceite, não uma nova auditoria ou reprodução de ataques.

| ID | Correção entregue | Referência |
| --- | --- | --- |
| SEC-01 | Atualização do Next.js de 16.1.1 para 16.3.3 e lockfile correspondente | [package.json](../web/package.json) e [lockfile](../web/package-lock.json) |
| SEC-02 | Reenvio exige sessão e `is_admin()`; 401 sem autenticação, 403 sem privilégio, autorização antes de `inviteUserByEmail`, erros sem detalhes internos | [resend-invite](../web/src/app/api/auth/resend-invite/route.ts) |
| SEC-03 | Remoção do log da URL completa no fluxo de definição/recuperação de senha | [definir-senha](../web/src/app/auth/definir-senha/page.tsx) |
| SEC-04 | `next` restrito a caminho interno seguro, fallback `/app`; falha de troca de código retorna à raiz | [callback](../web/src/app/auth/callback/route.ts) |

Rastreabilidade Git: patch original em `development` **310a0c8**, patch incorporado à produção **b371318**, fechamento da release **fd3167a**, tag **aleara-web-v0.11.1**, sincronização de `development` **0c1a310**. O patch alterou cinco arquivos: manifesto, lockfile e os três arquivos de autenticação acima.

Evidência histórica: o mentor registrou validação técnica pelo Codex; Sandro confirmou navegação funcional no Preview e, após o deploy da release, versão exibida no aplicativo, acesso administrativo e carregamento de uma loteria. O ciclo foi encerrado como sem regressão funcional aparente. Nesta tarefa, versões, alterações e referências Git foram inspecionadas localmente; testes técnicos e verificações HTTP não foram repetidos, e não se afirma que cada caso negativo tenha sido exercitado em produção.

O aceite não comprova ausência de exploração anterior, cobertura integral de autenticação, RLS efetiva, rate limiting ou segurança futura de dependências. Esses assuntos permanecem separados no [registro de pendências](pendencias.md); não reclassificar os quatro itens corrigidos como abertos com base em relatórios anteriores ao patch.
