# Trabalho com agentes

Regras aprovadas no planejamento de 08/09/2026. Princípio: **economizar contexto, não validação**.

## Responsabilidades

| Papel | Responsabilidade |
| --- | --- |
| Sandro | Decide produto, prioridades e mudanças relevantes; aprova escopo; valida comportamento visual e funcional em Preview e produção; pode executar Git mecânico já aprovado |
| Mentor técnico / advisor / PM | Mantém visão global, analisa alternativas e riscos, organiza prioridades e critérios de aceite, prepara tarefas e roteiros de validação, revisa os resultados e contesta direções com risco material |
| Codex | Investiga repositório e evidências, propõe soluções, implementa escopo aprovado, executa verificações técnicas, reporta limitações e mantém a documentação coerente com a entrega |

Fluxo: análise → alternativas e riscos → decisão de Sandro → execução → revisão. Recomendações não substituem aprovação. Dentro de um escopo já aprovado, resolver detalhes locais autonomamente e não pedir novamente a mesma autorização.

## Contrato de uma tarefa

Definir objetivo, escopo, não objetivos, restrições, critérios de aceite e validações. Ler instruções aplicáveis, conferir Git e consultar apenas a documentação e os arquivos pertinentes. Antes de escrever documentação, verificar referências existentes e preservar conteúdo útil.

Investigar livremente dentro dos acessos disponíveis. Mudanças relevantes em produto, arquitetura, schema/migrations, RLS, autenticação, dependências, runtime ou contratos precisam estar cobertas pela aprovação. Ao descobrir expansão necessária, apresentar achado, evidência, impacto, alternativas, recomendação e decisão exata que falta; continuar o trabalho independente autorizado. Não introduzir melhorias oportunistas ou executar ações destrutivas sem autorização.

## Execução e contexto

- Preferir buscas direcionadas, trechos, consultas estruturadas e diffs seletivos. Não carregar lockfiles ou logs completos quando bastam campos e resultados.
- Guardar o resultado das verificações e resumir sucesso; expandir logs na falha ou quando uma divergência exigir diagnóstico.
- Reutilizar evidências já estabelecidas e aplicáveis, respeitando versão, commit e ambiente. Consultar fontes oficiais quando a decisão depender de informação atual ou houver dúvida material.
- Executar todos os controles tecnicamente necessários ao escopo: testes existentes pertinentes, build, lint, TypeScript e segurança aplicável. Não omitir verificações obrigatórias para economizar tokens.
- Não duplicar a inspeção visual de Sandro sem motivo. Codex verifica aspectos técnicos e automatizáveis; Sandro testa fluxos reais. Confirmar que ambos estão falando do mesmo deployment.
- Uma entrega só documental pede revisão de conteúdo, links, diff e escopo. Não afirmar testes de aplicação que não foram executados nem impor uma nova suíte apenas para essa entrega.
- Nunca imprimir segredos, credenciais ou URLs com tokens de recuperação. Não enviar convites reais ou alterar dados para validar sem autorização correspondente.

## Entrega e memória permanente

O relatório deve distinguir implementado, validado, inferido, falhou, não executado e bloqueado. Informar resultado, evidência suficiente, limitações, achados fora de escopo e decisões pendentes, sem reproduzir o diff inteiro. Identificar ambiente e commit em validações de deploy.

Sandro e mentor decidem o que merece conhecimento permanente; Codex o mantém sincronizado. Documentar fatos e decisões recorrentes quando maduros, sem transformar `docs/` em depósito de logs ou propostas automáticas. Atualizar o status do item correspondente; novas hipóteses entram em [pendências](pendencias.md), não como fatos do baseline.
