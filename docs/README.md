# ALEARA — documentação do projeto

Base inicial em 08/09/2026, inspecionada em `development` no commit `0c1a310`. Esta pasta concentra conhecimento técnico e operacional recorrente para Sandro, mentor e agentes de IA. O conteúdo inicial está implementado documentalmente e aguarda revisão editorial de Sandro/mentor; isso não reabre decisões já aprovadas ou a validação da release.

## Leitura orientada

| Documento | Quando consultar |
| --- | --- |
| [Baseline técnico](baseline.md) | Entender o sistema, versões, qualidade e limites da inspeção |
| [Decisões](decisoes.md) | Consultar decisões aprovadas, estados e o fechamento de SEC-01..SEC-04 |
| [Git e release](git-release.md) | Preparar integração, promoção, release e limpeza de branches |
| [Trabalho com agentes](agentes.md) | Iniciar uma tarefa, dividir responsabilidades e validar a entrega |
| [Riscos e pendências](pendencias.md) | Escolher a próxima investigação e revisar documentação antiga |

Agentes devem começar por este índice e pelas regras de trabalho, carregando os demais documentos conforme o escopo. Os detalhes de componentes e migrations permanecem junto de suas implementações; os links estão no baseline.

## Fonte de verdade e evidência

- Código, lockfile e configuração versionados descrevem a implementação do commit inspecionado. Não provam, isoladamente, o que está ativo em produção.
- Decisões descrevem o comportamento aprovado. Se divergirem do código, registrar o desvio; não alterar silenciosamente a decisão nem presumir que foi implementada.
- Validação deve informar data, ambiente, versão/commit, responsável ou origem da evidência, resultado e limites. Build, Preview e produção são evidências distintas.
- Distinguir **observado** (inspeção direta), **validado** (execução ou evidência verificável), **inferido** (consequência ainda não demonstrada) e **proposto** (recomendação). Isso é independente do estado de uma tarefa.
- Configurações externas de Vercel e Supabase exigem evidência do ambiente. Migration presente não significa migration aplicada; dependência instalada não significa cobertura de testes.
- Hipóteses ficam identificadas nas pendências, com a confirmação necessária. Só mover para o baseline quando houver evidência. Não converter recomendações do mentor ou de um agente em aprovação de Sandro.
- Atualizar estes documentos quando uma entrega mudar o estado descrito. Reutilizar conhecimento ainda aplicável e rever fatos sujeitos a versões quando a decisão depender de sua atualidade.

Origem histórica: ciclo inicial de diagnóstico, segurança e organização de 08/09/2026, consolidando decisões de Sandro, análises do mentor, relatórios do Codex e validações do ciclo. Os fatos essenciais estão registrados nesta documentação, sem depender do acesso à conversa. Nesta tarefa não foram consultados dashboards, banco ou produção, nem repetidos os testes históricos.
