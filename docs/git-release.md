# Fluxo Git e release

Convenção aprovada em 08/09/2026. Confirmar estado e autorização da operação antes de aplicar uma sequência; os hashes abaixo são uma fotografia histórica, não os valores esperados para sempre.

## Branches

| Branch | Papel e ciclo de vida |
| --- | --- |
| `main` | Produção; recebe somente o conteúdo aprovado para promoção |
| `development` | Integração e próxima versão; preservar trabalho próprio ao incorporar produção |
| `feature/*`, `fix/*`, `release/*` | Trabalho temporário com objetivo e destino definidos; revisar exclusividade antes de remover |
| Branch automática do Release Please | Fechamento de versão; remover apenas depois de confirmar sua incorporação e conclusão |
| `archive/*` | Preservação excepcional de histórico; não é ambiente, linha de desenvolvimento ou conteúdo automaticamente aprovado para merge |

## Sequência operacional

1. Inspecionar branch, working tree, referências e diferença a promover. Preservar mudanças locais e trabalho exclusivo; não misturar pendências sem aprovação.
2. Implementar e revisar o escopo aprovado; executar os controles técnicos pertinentes. Usar PR e os checks existentes; não contornar restrições por falta de credencial.
3. Validar o Preview correspondente com Sandro. Confirmar ambiente e commit; Preview aprovado não equivale a produção aprovada.
4. Promover apenas o conteúdo aprovado para `main`. Um patch seletivo pode exigir branch temporária sobre produção; não incorporar toda `development` por conveniência.
5. Seguir o Release Please: o workflow roda em push na `main`, usa [configuração](../.release-please-config.json) e [manifesto](../.release-please-manifest.json). Conferir o PR automático, versão, lockfile e changelog antes de fechar a release. A configuração atual produz o changelog em `web/web/CHANGELOG.md`; não mover o arquivo sem revisar esse mecanismo.
6. Confirmar o deployment e sua versão/commit. Sandro executa smoke test curto em produção, orientado pelo mentor. Registrar resultado e limites antes de marcar Validado em produção.
7. Sincronizar `main` de volta para `development`, preservando seu histórico próprio. Depois classificar e remover branches temporárias já concluídas; conferir estado final e worktrees.

A publicação e validação de 0.11.1 estão em [decisões](decisoes.md#release-de-segurança-0111). Seu fechamento incluiu merge local da branch automática do Release Please, conforme sequência acompanhada por Sandro; esse episódio não cria autorização geral para ignorar PRs ou proteções.

## Terminal e cautelas de histórico

Sandro pode executar operações simples, determinísticas e já aprovadas. Preparar blocos completos com verificações e critérios de parada. O terminal de Sandro já estará na raiz: omitir `cd` e `echo`, usar `git --no-pager` em consultas extensas e mensagem explícita quando um merge criar commit. Não mascarar erros relevantes com tratamento genérico.

Conflitos, divergência inesperada, rebase, cherry-pick seletivo, recuperação, force-push ou exclusão sem classificação exigem análise antes da operação. Evitar reescrita de histórico para ajustes cosméticos. Uma lista de comandos antiga não autoriza sua repetição em um estado novo.

## Fotografia após a higiene de 08/09/2026

- `main` e referência local de `origin/main`: `fd3167a4d38901d8a3f6bf21f8ba60edda525b72`.
- `development` e referência local de `origin/development`: `0c1a310c53456df6809f11fc67104d9e840d1517`.
- Archive preservado: `archive/zdd-worktree-2026-09-08` → `88343d068ad68418f7c6981e3edc79aaea786a2b`.
- Histórico registra remoção de `fix/features`, `release/security-auth-next-16.3.3`, branch automática da release e worktrees extras. Inspeção inicial desta tarefa: working tree limpa em `development`, somente branches locais `main`, `development` e archive.

Referências remotas foram lidas do Git local, sem novo fetch nesta tarefa. O archive preserva os commits `225ec753` e `88343d06` para comparação posterior. Não fazer merge nem excluir por suposta equivalência funcional; preservar também o trabalho de `development`, incluindo o histórico de `648159a`.
