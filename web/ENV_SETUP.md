# Guia de Configuração de Variáveis de Ambiente

## Resumo Rápido

**Variáveis que podem ser IGUAIS entre local e Vercel:**

- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅

**Variável que DEVE ser DIFERENTE:**

- `SITE_URL` ou `NEXT_PUBLIC_SITE_URL` ⚠️
  - **Local:** `http://localhost:3000`
  - **Vercel:** `https://seu-dominio.vercel.app`

---

## Variáveis Obrigatórias

### 1. `NEXT_PUBLIC_SUPABASE_URL`

- **Pode ser igual ao da Vercel?** ✅ SIM
- **O que é:** URL do seu projeto Supabase
- **Formato:** `https://xxxxx.supabase.co`
- **Exemplo:** `https://abcdefghijklmnop.supabase.co`

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- **Pode ser igual ao da Vercel?** ✅ SIM
- **O que é:** Chave anônima pública do Supabase (segura para o cliente)
- **Formato:** JWT token longo
- **Onde encontrar:** Dashboard do Supabase → Settings → API → `anon` `public` key

### 3. `SUPABASE_SERVICE_ROLE_KEY` (Opcional em dev, obrigatória em prod)

- **Pode ser igual ao da Vercel?** ✅ SIM
- **O que é:** Chave de service role que bypassa RLS (apenas server-side)
- **⚠️ SEGURANÇA:** NUNCA exponha no cliente! Apenas em endpoints server-side
- **Onde encontrar:** Dashboard do Supabase → Settings → API → `service_role` `secret` key

---

## Variável que DEVE ser DIFERENTE

### `SITE_URL` ou `NEXT_PUBLIC_SITE_URL`

- **Pode ser igual ao da Vercel?** ❌ NÃO (deve ser diferente!)
- **O que é:** URL base da aplicação usada para:
  - Links de autenticação em emails (convites, magic links)
  - Redirects após login/callback
  - URLs absolutas em emails

#### Para Desenvolvimento Local (`.env.local`):

```env
SITE_URL=http://localhost:3000
# OU
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### Para Produção (Vercel):

```env
SITE_URL=https://seu-dominio.vercel.app
# OU
NEXT_PUBLIC_SITE_URL=https://seu-dominio.vercel.app
```

**Por que precisa ser diferente?**

- Emails enviados em produção devem apontar para a URL de produção
- Emails enviados localmente (se você testar) devem apontar para localhost
- O Supabase precisa saber para onde redirecionar após autenticação

---

## Exemplo de `.env.local` Completo

```env
# ============================================
# SUPABASE (podem ser iguais ao da Vercel)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# SITE URL (DEVE ser diferente - localhost para dev)
# ============================================
SITE_URL=http://localhost:3000
# OU use NEXT_PUBLIC_SITE_URL se preferir
# NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Como Configurar

1. **Crie o arquivo `.env.local` na raiz de `/web`:**

   ```bash
   cd web
   touch .env.local
   ```

2. **Copie as variáveis da Vercel:**
   - Vá em Vercel → Seu Projeto → Settings → Environment Variables
   - Copie todas as variáveis

3. **Ajuste o `SITE_URL`:**
   - Altere `SITE_URL` ou `NEXT_PUBLIC_SITE_URL` para `http://localhost:3000`
   - Mantenha as outras variáveis iguais

4. **Verifique se está correto:**
   ```bash
   npm run dev
   ```
   Você deve ver: `[env] Environment looks good.`

---

## Configuração no Supabase Dashboard

Além do `.env.local`, você também precisa configurar no Supabase:

1. **Site URL:**
   - Dashboard → Authentication → URL Configuration
   - **Site URL:** `http://localhost:3000` (para dev)
   - **Redirect URLs:** Adicione:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/definir-senha`

2. **Para Produção (Vercel):**
   - Adicione também as URLs de produção nas Redirect URLs

---

## Troubleshooting

### Erro: "Missing required environment variable"

- Verifique se o arquivo está em `/web/.env.local` (não na raiz do projeto)
- Verifique se não há espaços extras ou aspas desnecessárias
- Reinicie o servidor após alterar o `.env.local`

### Erro: "Invalid NEXT_PUBLIC_SUPABASE_URL"

- Verifique se a URL termina com `.supabase.co`
- Verifique se não há barra `/` no final
- Formato correto: `https://xxxxx.supabase.co`

### Links de autenticação não funcionam localmente

- Verifique se `SITE_URL=http://localhost:3000` está definido
- Verifique se as Redirect URLs estão configuradas no Supabase
- Verifique se está usando `http://` (não `https://`) para localhost

---

## Checklist

- [ ] Arquivo `.env.local` criado em `/web/.env.local`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado (igual ao da Vercel)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurado (igual ao da Vercel)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado (igual ao da Vercel)
- [ ] `SITE_URL=http://localhost:3000` configurado (diferente do da Vercel)
- [ ] Supabase Dashboard: Site URL = `http://localhost:3000`
- [ ] Supabase Dashboard: Redirect URLs incluem `http://localhost:3000/auth/callback`
- [ ] `npm run dev` mostra `[env] Environment looks good.`
