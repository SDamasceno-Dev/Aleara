# Levantamento de Implementação - Lotomania

## 📋 Regras da Lotomania

- **Números disponíveis:** 100 (de 01 a 00)
- **Números escolhidos:** 50 (sem repetição)
- **Prêmios:** 15, 16, 17, 18, 19 e 20 acertos
- **Formato de números:** 01 a 00 (onde 00 representa o número 100)

---

## 🗄️ 1. DATABASE MIGRATIONS (Supabase)

### 1.1. Tabela de Sorteios (`lotomania_draws`)
**Arquivo:** `web/supabase/migrations/YYYYMMDD_HHMMSS__lotomania__draws__schema.sql`

**Estrutura necessária:**
- `concurso` (integer, PK)
- `data_sorteio` (date)
- `bola1` a `bola50` (smallint, check between 1 and 100)
- `ganhadores_20`, `ganhadores_19`, `ganhadores_18`, `ganhadores_17`, `ganhadores_16`, `ganhadores_15` (integer)
- `rateio_20`, `rateio_19`, `rateio_18`, `rateio_17`, `rateio_16`, `rateio_15` (numeric)
- `acumulado_20` (numeric)
- `arrecadacao_total`, `estimativa_premio` (numeric)
- `observacao` (text)
- `created_at`, `updated_at` (timestamptz)
- Índice em `data_sorteio`
- RLS: authenticated pode ler, admin pode escrever

**Baseado em:** `20251126_000018__quina__draws__schema.sql`

---

### 1.2. Tabela de Estatísticas de Dezenas (`lotomania_stats_dezenas`)
**Arquivo:** `web/supabase/migrations/YYYYMMDD_HHMMSS__lotomania__stats_dezenas__schema.sql`

**Estrutura necessária:**
- `dezena` (smallint, PK, check between 1 and 100)
- `vezes_sorteada` (integer, default 0)
- `pct_sorteios` (numeric, default 0)
- `total_sorteios` (integer, default 0)
- `updated_at` (timestamptz)
- Índice em `vezes_sorteada desc, dezena asc`
- Trigger para `updated_at`
- RLS: authenticated pode ler, admin pode escrever

**Baseado em:** `20251126_000019__quina__stats_dezenas__schema.sql`

---

### 1.3. Tabelas de Estudos (`lotomania_stats_catalog` e `lotomania_stats_items`)
**Arquivo:** `web/supabase/migrations/YYYYMMDD_HHMMSS__lotomania__studies__schema.sql`

**Estrutura necessária:**
- `lotomania_stats_catalog`:
  - `study_key` (text, PK)
  - `title` (text)
  - `params` (jsonb, default '{}')
  - `updated_at` (timestamptz)
- `lotomania_stats_items`:
  - `study_key` (text, FK → catalog)
  - `item_key` (text)
  - `rank` (integer)
  - `value` (numeric)
  - `extra` (jsonb, default '{}')
  - PK: `(study_key, item_key)`
  - Índices: `(study_key, rank)`, `(study_key, value desc)`
- RLS: authenticated pode ler, admin pode escrever

**Baseado em:** `20251126_000020__quina__studies__schema.sql`

---

### 1.4. Tabelas de Jogos do Usuário (`lotomania_user_sets` e `lotomania_user_items`)
**Arquivo:** `web/supabase/migrations/YYYYMMDD_HHMMSS__lotomania__games__schema.sql`

**Estrutura necessária:**
- `lotomania_user_sets`:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → auth.users)
  - `source_numbers` (smallint[], check: length between 50 and 100)
  - `total_combinations` (integer, default 0)
  - `sample_size` (integer, default 0, check >= 0)
  - `seed` (bigint)
  - `title` (text, nullable)
  - `marked_idx` (integer, nullable)
  - `created_at`, `expires_at` (timestamptz)
  - Índice: `(user_id, created_at desc)`
- `lotomania_user_items`:
  - `set_id` (uuid, FK → user_sets)
  - `position` (integer)
  - `numbers` (smallint[], check: length = 50)
  - `matches` (smallint, nullable)
  - PK: `(set_id, position)`
  - Índice: `(set_id, position)`
- RLS: owner policies (user_id = auth.uid())

**Baseado em:** `20251126_000021__quina__games__schema.sql` + `20251210_000102__quina__sets_add_title_marked_idx.sql`

**Ajustes específicos:**
- `source_numbers`: 50 a 100 números (Lotomania permite escolher 50 números de 100)
- `user_items.numbers`: sempre 50 números (tamanho fixo)
- Combinações: C(n, 50) onde n = quantidade de source_numbers

---

### 1.5. Tabelas de Conferências (`lotomania_checks` e `lotomania_check_items`)
**Arquivo:** `web/supabase/migrations/YYYYMMDD_HHMMSS__lotomania__checks__schema.sql`

**Estrutura necessária:**
- `lotomania_checks`:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → auth.users)
  - `set_id` (uuid, FK → user_sets)
  - `contest_no` (integer)
  - `draw_numbers` (smallint[50])
  - `checked_at` (timestamptz)
  - Índice: `(user_id, checked_at desc)`
  - Unique: `(user_id, set_id, contest_no)`
- `lotomania_check_items`:
  - `check_id` (uuid, FK → checks)
  - `position` (integer)
  - `numbers` (smallint[50])
  - `matches` (smallint, check: between 15 and 20)
  - PK: `(check_id, position)`
  - Índice: `(check_id, position)`
- RLS: owner policies

**Baseado em:** `20251126_000022__quina__checks__schema.sql`

**Ajustes específicos:**
- `draw_numbers`: sempre 50 números
- `matches`: entre 15 e 20 (prêmios da Lotomania)

---

### 1.6. Tabelas de Listas de Apostas (`lotomania_bet_lists` e `lotomania_bet_list_items`)
**Arquivo:** `web/supabase/migrations/YYYYMMDD_HHMMSS__lotomania__bet_lists__schema.sql`

**Estrutura necessária:**
- `lotomania_bet_lists`:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK → auth.users)
  - `contest_no` (integer, nullable)
  - `title` (text, nullable)
  - `is_favorite` (boolean, default false)
  - `created_at` (timestamptz)
  - Unique: `(user_id, contest_no)` onde contest_no não é null
- `lotomania_bet_list_items`:
  - `list_id` (uuid, FK → bet_lists)
  - `position` (integer)
  - `numbers` (smallint[], check: length = 50)
  - PK: `(list_id, position)` ou `(list_id, numbers)` (verificar padrão)
- RLS: owner policies

**Baseado em:** `20251126_000023__quina__bet_lists__schema.sql`

**Ajustes específicos:**
- `bet_list_items.numbers`: sempre 50 números (tamanho fixo)

---

## 🔌 2. API ENDPOINTS (`/api/loterias/lotomania/`)

### 2.1. Importação de Dados
**Arquivo:** `web/src/app/api/loterias/lotomania/import/route.ts`

**Funcionalidades:**
- POST: Importar CSV de sorteios
- Validar formato: 50 números por linha
- Atualizar `lotomania_draws`
- Calcular e atualizar `lotomania_stats_dezenas`
- Gerar estudos estatísticos (similar aos da Quina/Mega-Sena)
- Apenas admin pode executar

**Baseado em:** `web/src/app/api/loterias/quina/import/route.ts`

**Ajustes específicos:**
- Validar 50 números por sorteio (1-100)
- Calcular frequências para 100 dezenas (não 80)
- Estudos adaptados para 50 números sorteados

---

### 2.2. Estudos Estatísticos
**Arquivo:** `web/src/app/api/loterias/lotomania/studies/route.ts`

**Funcionalidades:**
- GET sem `study_key`: retorna catálogo de estudos
- GET com `study_key`: retorna estudo específico com itens
- Suporta `limit` (padrão 60, máximo 10000)
- Retorna: `study` (catalog) e `items` (array)

**Baseado em:** `web/src/app/api/loterias/quina/studies/route.ts`

---

### 2.3. Total de Jogos
**Arquivo:** `web/src/app/api/loterias/lotomania/total-draws/route.ts`

**Funcionalidades:**
- GET: retorna `total_sorteios` de `lotomania_stats_dezenas`
- Usado para exportação CSV

**Baseado em:** `web/src/app/api/loterias/quina/total-draws/route.ts`

---

### 2.4. Limpar Dados
**Arquivo:** `web/src/app/api/loterias/lotomania/clear/route.ts`

**Funcionalidades:**
- POST: limpa todas as tabelas da Lotomania (admin only)
- Usado para testes/reset

**Baseado em:** `web/src/app/api/loterias/quina/clear/route.ts`

---

### 2.5. Jogos - Gerar Combinações
**Arquivo:** `web/src/app/api/loterias/lotomania/games/generate/route.ts`

**Funcionalidades:**
- POST: gera combinações C(n, 50) a partir de source_numbers
- Valida: 50 a 100 números únicos (1-100)
- Gera até 5000 combinações (cap)
- Usa seed para determinismo
- Salva em `lotomania_user_sets` e `lotomania_user_items`
- **Preserva ordem de inserção** nos source_numbers
- Ordena apenas os números dentro dos jogos gerados

**Baseado em:** `web/src/app/api/loterias/quina/games/generate/route.ts`

**Ajustes específicos:**
- Combinações: C(n, 50) ao invés de C(n, 5)
- Validação: números entre 1 e 100
- `k` máximo: considerar que C(100, 50) é muito grande, manter cap de 5000

---

### 2.6. Jogos - Substituir Combinações
**Arquivo:** `web/src/app/api/loterias/lotomania/games/generate/replace/route.ts`

**Funcionalidades:**
- POST: substitui combinações de um set existente
- Similar ao generate, mas atualiza set existente
- **Preserva ordem de inserção** nos source_numbers

**Baseado em:** `web/src/app/api/loterias/quina/games/generate/replace/route.ts`

---

### 2.7. Jogos - Adicionar Itens Manualmente
**Arquivo:** `web/src/app/api/loterias/lotomania/games/add-items/route.ts`

**Funcionalidades:**
- POST: adiciona jogos manualmente (50 números cada)
- Cria set se não existir
- **Preserva ordem de inserção** nos source_numbers
- Ordena apenas os números dentro dos jogos

**Baseado em:** `web/src/app/api/loterias/quina/games/add-items/route.ts`

**Ajustes específicos:**
- Validar: cada item deve ter exatamente 50 números
- Números entre 1 e 100

---

### 2.8. Jogos - Reamostrar
**Arquivo:** `web/src/app/api/loterias/lotomania/games/resample/route.ts`

**Funcionalidades:**
- POST: reamostra combinações de um set existente
- Mantém source_numbers, altera seed e combinações geradas

**Baseado em:** `web/src/app/api/loterias/quina/games/resample/route.ts`

---

### 2.9. Jogos - Conferir Resultado
**Arquivo:** `web/src/app/api/loterias/lotomania/games/check/route.ts`

**Funcionalidades:**
- POST: confere jogos contra um sorteio
- Recebe: `setId`, `draw` (50 números)
- Calcula matches (15-20 acertos)
- Atualiza `matches` em `lotomania_user_items`
- Retorna itens com matches calculados

**Baseado em:** `web/src/app/api/loterias/quina/games/check/route.ts`

**Ajustes específicos:**
- Validar draw: exatamente 50 números (1-100)
- Matches: entre 15 e 20 (prêmios da Lotomania)

---

### 2.10. Jogos - Salvar Conferência
**Arquivo:** `web/src/app/api/loterias/lotomania/games/save-check/route.ts`

**Funcionalidades:**
- POST: salva resultado de conferência em `lotomania_checks`
- Cria check e check_items
- Evita duplicatas por (user_id, set_id, contest_no)

**Baseado em:** `web/src/app/api/loterias/quina/games/save-check/route.ts`

---

### 2.11. Jogos - Deletar Conferências
**Arquivo:** `web/src/app/api/loterias/lotomania/games/delete-checks/route.ts`

**Funcionalidades:**
- POST: deleta conferências de um set
- Owner only

**Baseado em:** `web/src/app/api/loterias/quina/games/delete-checks/route.ts`

---

### 2.12. Jogos - Buscar Set por ID
**Arquivo:** `web/src/app/api/loterias/lotomania/games/[setId]/route.ts`

**Funcionalidades:**
- GET: retorna set e seus items
- Suporta paginação (`page`, `size`)
- Owner only (RLS)

**Baseado em:** `web/src/app/api/loterias/mega-sena/games/[setId]/route.ts`

---

### 2.13. Jogos - Sets - Listar
**Arquivo:** `web/src/app/api/loterias/lotomania/games/sets/list/route.ts`

**Funcionalidades:**
- GET: lista sets do usuário com título
- Filtra: `title IS NOT NULL`
- Ordena por `created_at desc`
- Limite: 200

**Baseado em:** `web/src/app/api/loterias/quina/games/sets/list/route.ts`

---

### 2.14. Jogos - Sets - Salvar Metadados
**Arquivo:** `web/src/app/api/loterias/lotomania/games/sets/save-meta/route.ts`

**Funcionalidades:**
- POST: atualiza `title` e `marked_idx` de um set
- Owner only

**Baseado em:** `web/src/app/api/loterias/quina/games/sets/save-meta/route.ts`

---

### 2.15. Jogos - Sets - Deletar
**Arquivo:** `web/src/app/api/loterias/lotomania/games/sets/delete/route.ts`

**Funcionalidades:**
- POST: deleta um set (cascade para items)
- Owner only

**Baseado em:** `web/src/app/api/loterias/quina/games/sets/delete/route.ts`

---

### 2.16. Jogos - Apostas - Salvar por Concurso
**Arquivo:** `web/src/app/api/loterias/lotomania/games/bets/save-by-contest/route.ts`

**Funcionalidades:**
- POST: salva lista de apostas vinculada a um concurso
- Cria/atualiza `lotomania_bet_lists` e `lotomania_bet_list_items`

**Baseado em:** `web/src/app/api/loterias/quina/games/bets/save-by-contest/route.ts`

**Ajustes específicos:**
- Validar: cada aposta com 50 números

---

### 2.17. Jogos - Apostas - Carregar por Concurso
**Arquivo:** `web/src/app/api/loterias/lotomania/games/bets/load-by-contest/route.ts`

**Funcionalidades:**
- POST: carrega apostas de um concurso
- Modos: `append` ou `replace`
- Pode criar set automaticamente

**Baseado em:** `web/src/app/api/loterias/quina/games/bets/load-by-contest/route.ts`

---

### 2.18. Jogos - Apostas - Listas
**Arquivo:** `web/src/app/api/loterias/lotomania/games/bets/lists/route.ts`

**Funcionalidades:**
- GET: lista bet_lists do usuário
- POST: cria/atualiza bet_list

**Baseado em:** `web/src/app/api/loterias/quina/games/bets/lists/route.ts`

---

### 2.19. Jogos - Apostas - Deletar Lista
**Arquivo:** `web/src/app/api/loterias/lotomania/games/bets/lists/delete/route.ts`

**Funcionalidades:**
- POST: deleta bet_list (cascade para items)
- Owner only

**Baseado em:** `web/src/app/api/loterias/quina/games/bets/lists/delete/route.ts`

---

### 2.20. Relatórios - Último
**Arquivo:** `web/src/app/api/loterias/lotomania/reports/latest/route.ts`

**Funcionalidades:**
- GET: retorna última conferência do usuário
- Inclui KPIs: total, c15, c16, c17, c18, c19, c20, hitRate

**Baseado em:** `web/src/app/api/loterias/quina/reports/latest/route.ts`

**Ajustes específicos:**
- KPIs: c15, c16, c17, c18, c19, c20 (ao invés de c2, c3, c4, c5)

---

### 2.21. Relatórios - Por Concurso
**Arquivo:** `web/src/app/api/loterias/lotomania/reports/by-contest/route.ts`

**Funcionalidades:**
- GET: retorna conferência de um concurso específico
- Query: `contestNo`

**Baseado em:** `web/src/app/api/loterias/quina/reports/by-contest/route.ts`

---

### 2.22. Relatórios - Agregado
**Arquivo:** `web/src/app/api/loterias/lotomania/reports/aggregate/route.ts`

**Funcionalidades:**
- GET: retorna estatísticas agregadas de todas as conferências
- KPIs: totais por faixa de acertos (15-20)

**Baseado em:** `web/src/app/api/loterias/quina/reports/aggregate/route.ts`

---

## 🎨 3. COMPONENTES FRONTEND (`/app/app/lotomania/`)

### 3.1. Página Principal
**Arquivo:** `web/src/app/app/lotomania/page.tsx`

**Estrutura:**
- Server Component (RSC)
- Tabs: Dados, Jogos, Relatórios, Importação (admin)
- Layout similar à Quina/Mega-Sena
- Verifica `is_admin()` para mostrar aba Importação

**Baseado em:** `web/src/app/app/quina/page.tsx`

---

### 3.2. Painel de Dados (`DataPanel.tsx`)
**Arquivo:** `web/src/app/app/lotomania/DataPanel.tsx`

**Funcionalidades:**
- Server Component que busca:
  - Últimos 3 sorteios (`lotomania_draws`)
  - Estatísticas de dezenas (`lotomania_stats_dezenas`)
  - Catálogo de estudos (`lotomania_stats_catalog`)
  - Preview de estudos (`lotomania_stats_items`)
- Renderiza:
  - Tabela de últimos sorteios
  - Tabela de frequência de dezenas
  - `StudiesSidebar` com previews

**Baseado em:** `web/src/app/app/quina/DataPanel.tsx`

**Ajustes específicos:**
- 50 números por sorteio
- 100 dezenas (1-100) ao invés de 80
- Preview keys: adaptar estudos para Lotomania

---

### 3.3. Sidebar de Estudos (`StudiesSidebar.tsx`)
**Arquivo:** `web/src/app/app/lotomania/StudiesSidebar.tsx`

**Funcionalidades:**
- Client Component
- Lista estudos com preview (top 5 itens)
- Select para escolher estudo completo
- Botão "Exportar" que exporta TODOS os estudos em CSV
- Ícone Info com tooltip para cada estudo
- Descrições dos estudos (useMemo)
- Modal/dialog para visualizar estudo completo

**Baseado em:** `web/src/app/app/quina/StudiesSidebar.tsx`

**Ajustes específicos:**
- Descrições adaptadas para Lotomania
- Exportação: 10 itens por estudo
- Endpoint: `/api/loterias/lotomania/studies`
- Endpoint total: `/api/loterias/lotomania/total-draws`

---

### 3.4. Painel de Jogos (`GamesPanel.tsx`)
**Arquivo:** `web/src/app/app/lotomania/GamesPanel.tsx`

**Funcionalidades:**
- Client Component completo
- **Registrar Apostas (Manual):**
  - Inputs para 50 números (01-00)
  - Validação: números entre 1-100, sem duplicatas
  - Botão "Registrar"
- **Gerar Combinações:**
  - Inputs para source_numbers (50-100 números)
  - Input para k (quantidade de combinações)
  - Seed opcional
  - Checkbox "Adicionar aos jogos existentes"
  - Select de combinações salvas
  - Input de título da combinação
  - Botão "Gerar"
  - **Preservar ordem de inserção** nos source_numbers
- **Conferir Resultado:**
  - Inputs para 50 números do sorteio
  - Botão "Conferir"
  - Exibe matches (15-20)
- **Lista de Jogos Gerados:**
  - Tabela com position, numbers, matches
  - Ordenação
  - Paginação se necessário
- **Ações:**
  - Salvar conferência
  - Deletar set
  - Reamostrar

**Baseado em:** `web/src/app/app/quina/GamesPanel.tsx`

**Ajustes específicos:**
- 50 números por jogo (não 5)
- Validação: números 1-100 (não 1-80)
- Matches: 15-20 (não 2-5)
- `regCountInput`: padrão '50'
- `countInput`: padrão '50' (source_numbers mínimo)
- Endpoints: `/api/loterias/lotomania/games/*`

---

### 3.5. Painel de Relatórios (`ReportsPanel.tsx`)
**Arquivo:** `web/src/app/app/lotomania/ReportsPanel.tsx`

**Funcionalidades:**
- Client Component
- Busca última conferência
- Exibe KPIs: total, c15, c16, c17, c18, c19, c20, hitRate
- Tabela de jogos com matches
- Filtros e ordenação

**Baseado em:** `web/src/app/app/quina/ReportsPanel.tsx`

**Ajustes específicos:**
- KPIs: c15, c16, c17, c18, c19, c20
- Endpoint: `/api/loterias/lotomania/reports/latest`

---

### 3.6. Painel de Importação (`ImportCsvPanel.tsx`)
**Arquivo:** `web/src/app/app/lotomania/ImportCsvPanel.tsx`

**Funcionalidades:**
- Client Component (admin only)
- Upload de CSV
- Preview antes de importar
- Validação de formato
- Feedback de progresso
- Endpoint: `/api/loterias/lotomania/import`

**Baseado em:** `web/src/app/app/quina/ImportCsvPanel.tsx`

**Ajustes específicos:**
- Validar 50 números por linha
- Números entre 1-100

---

### 3.7. Tabela de Frequência (`FrequencyTable.tsx`) - Opcional
**Arquivo:** `web/src/app/app/lotomania/FrequencyTable.tsx`

**Funcionalidades:**
- Componente reutilizável para exibir frequência de dezenas
- Pode ser extraído do DataPanel se necessário

**Baseado em:** `web/src/app/app/mega-sena/FrequencyTable.tsx` (se existir)

---

## 📄 4. PÁGINAS PÚBLICAS

### 4.1. Página de Redirecionamento
**Arquivo:** `web/src/app/lotomania/page.tsx`

**Funcionalidade:**
- Redireciona para `/app/lotomania`

**Baseado em:** `web/src/app/quina/page.tsx`

---

## 🔧 5. AJUSTES ESPECÍFICOS DA LOTOMANIA

### 5.1. Validações de Números
- **Range:** 1 a 100 (onde 00 = 100)
- **Formato de exibição:** 01, 02, ..., 99, 00
- **Validação:** `Number.isInteger(n) && n >= 1 && n <= 100`

### 5.2. Combinações Matemáticas
- **Fórmula:** C(n, 50) onde n = quantidade de source_numbers (50-100)
- **Exemplo:** C(100, 50) = 100,891,344,545,564,193,334,812,497,256
- **Limite prático:** Cap de 5000 combinações geradas

### 5.3. Faixas de Prêmios
- **15 acertos:** Prêmio mínimo
- **16, 17, 18, 19 acertos:** Prêmios intermediários
- **20 acertos:** Prêmio máximo
- **Validação:** `matches >= 15 && matches <= 20`

### 5.4. Estudos Estatísticos
Adaptar estudos existentes para 50 números:
- `overdue_dezena`: Dezenas com maior atraso (1-100)
- `pair_freq`: Pares mais frequentes
- `window200_hot`: Dezenas quentes nos últimos 200 concursos
- `decade_dist`: Distribuição por décadas (1-10, 11-20, ..., 91-100)
- `last_digit`: Último dígito (0-9, onde 00 = 0)
- Outros estudos adaptados

### 5.5. Preservação de Ordem
- **source_numbers:** Sempre preservar ordem de inserção
- **numbers nos jogos:** Sempre ordenar (crescente)
- Aplicar em todos os endpoints de games

---

## 📊 6. CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Database
- [ ] Migration: `lotomania_draws`
- [ ] Migration: `lotomania_stats_dezenas`
- [ ] Migration: `lotomania_stats_catalog` + `lotomania_stats_items`
- [ ] Migration: `lotomania_user_sets` + `lotomania_user_items`
- [ ] Migration: `lotomania_checks` + `lotomania_check_items`
- [ ] Migration: `lotomania_bet_lists` + `lotomania_bet_list_items`
- [ ] Migration: Adicionar `title` e `marked_idx` aos sets (se não incluído)

### Fase 2: API Endpoints
- [ ] `/import` - Importação CSV
- [ ] `/studies` - Estudos estatísticos
- [ ] `/total-draws` - Total de jogos
- [ ] `/clear` - Limpar dados
- [ ] `/games/generate` - Gerar combinações
- [ ] `/games/generate/replace` - Substituir combinações
- [ ] `/games/add-items` - Adicionar jogos manualmente
- [ ] `/games/resample` - Reamostrar
- [ ] `/games/check` - Conferir resultado
- [ ] `/games/save-check` - Salvar conferência
- [ ] `/games/delete-checks` - Deletar conferências
- [ ] `/games/[setId]` - Buscar set
- [ ] `/games/sets/list` - Listar sets
- [ ] `/games/sets/save-meta` - Salvar metadados
- [ ] `/games/sets/delete` - Deletar set
- [ ] `/games/bets/save-by-contest` - Salvar apostas por concurso
- [ ] `/games/bets/load-by-contest` - Carregar apostas por concurso
- [ ] `/games/bets/lists` - Gerenciar listas de apostas
- [ ] `/games/bets/lists/delete` - Deletar lista
- [ ] `/reports/latest` - Último relatório
- [ ] `/reports/by-contest` - Relatório por concurso
- [ ] `/reports/aggregate` - Relatório agregado

### Fase 3: Componentes Frontend
- [ ] `page.tsx` - Página principal com tabs
- [ ] `DataPanel.tsx` - Painel de dados
- [ ] `StudiesSidebar.tsx` - Sidebar de estudos
- [ ] `GamesPanel.tsx` - Painel de jogos
- [ ] `ReportsPanel.tsx` - Painel de relatórios
- [ ] `ImportCsvPanel.tsx` - Painel de importação (admin)

### Fase 4: Páginas Públicas
- [ ] `/lotomania/page.tsx` - Redirecionamento

### Fase 5: Validações e Testes
- [ ] Validar números 1-100 (00 = 100)
- [ ] Validar 50 números por jogo
- [ ] Validar matches 15-20
- [ ] Testar preservação de ordem nos source_numbers
- [ ] Testar ordenação nos números dos jogos
- [ ] Testar exportação CSV
- [ ] Testar importação CSV
- [ ] Testar geração de combinações
- [ ] Testar conferência de resultados

---

## 📝 7. NOTAS IMPORTANTES

### 7.1. Números 00 vs 100
- **Armazenamento:** Sempre usar 100 no banco
- **Exibição:** Mostrar como "00" quando for 100
- **Validação:** Aceitar tanto "00" quanto "100" no input
- **Conversão:** `"00" → 100`, `"01" → 1`, etc.

### 7.2. Combinações Grandes
- C(100, 50) é extremamente grande
- Considerar limite prático de source_numbers (ex: máximo 70-80)
- Ou implementar paginação/streaming para grandes volumes

### 7.3. Performance
- Índices adequados em todas as tabelas
- Paginação em endpoints que retornam muitos dados
- Batch inserts para grandes volumes

### 7.4. Consistência
- Seguir padrões da Quina (mais recente)
- Manter estrutura de RLS consistente
- Usar mesmos padrões de validação e erro

---

## 🎯 8. ORDEM RECOMENDADA DE IMPLEMENTAÇÃO

1. **Migrations** (Fase 1)
2. **API Básica** (import, studies, total-draws)
3. **API Games** (generate, add-items, check)
4. **Componentes Frontend** (DataPanel, StudiesSidebar)
5. **GamesPanel** (mais complexo)
6. **ReportsPanel**
7. **ImportCsvPanel** (admin)
8. **Testes e Ajustes**

---

Este documento serve como guia completo para implementação da Lotomania seguindo os padrões estabelecidos pela Mega-Sena e Quina.
