# CONFIGURAÇÃO EXATA — Dados que você precisa fornecer

Abaixo, cada variável com:
1. **Onde obter**
2. **Onde colocar** (arquivo + caminho)
3. **Formato / exemplo**
4. **Objetivo**

---

## BLOCO A — Configuração do Dashboard (Next.js / Vercel)

Arquivo alvo: `C:\Agent_Varcom\apps\web-dashboard\.env.local`
(no Vercel: Project Settings → Environment Variables)

| # | Variável | 1. Onde obter | 3. Formato / Exemplo | 4. Objetivo |
|---|---|---|---|---|
| A1 | `NEXT_PUBLIC_SUPABASE_URL` | Painel Supabase → **Project Settings → API → Project URL** | `https://abc123xyz.supabase.co` | URL do backend Supabase (Postgres + Auth). **Pública** — pode ir para o navegador. |
| A2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Painel Supabase → **Project Settings → API → Project API keys → anon public** | Começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Chave anônima usada no navegador e na validação de sessão SSR. |
| A3 | `SUPABASE_SERVICE_ROLE_KEY` | Painel Supabase → **Project Settings → API → Project API keys → service_role** | Começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (diferente da A2). **CONFIDENCIAL — nunca coloque no frontend nem no git.** | Usado na API (`/api/sync/summary` e `/api/dashboard-data`) para escrever/ler ignorando RLS. |
| A4 | `NEXTAUTH_SECRET` | Gere localmente qualquer string forte. PowerShell: `[guid]::NewGuid().ToString('n')+[guid]::NewGuid().ToString('n')` | `a1b2c3d4e5f6...` (mín. 32 caracteres) | Segredo extra para assinatura. Opcional hoje porque usamos o gerenciado do Supabase, mas recomendado preencher. |

---

## BLOCO B — Configuração no Painel Supabase (SQL Editor)

| # | Ação | 1. Onde obter | Onde colocar | Formato / Exemplo |
|---|---|---|---|---|
| B1 | Rodar migration `0001_init_mvp.sql` | Arquivo: [0001_init_mvp.sql](../apps/web-dashboard/supabase/migrations/0001_init_mvp.sql) | Painel Supabase → **SQL Editor → New Query** | Cole o conteúdo do arquivo e clique **Run**. Cria as 3 tabelas + índices. |
| B2 | Rodar seed (opcional, mas recomendado) | Arquivo: [seed.sql](../apps/web-dashboard/supabase/seed.sql) | Painel Supabase → **SQL Editor → New Query** | **ANTES de rodar, edite a linha `api_token` e coloque um TOKEN FORTE ÚNICO** (ex.: gere no PowerShell `[guid]::NewGuid().ToString('n')+[guid]::NewGuid().ToString('n')`). |
| B3 | Criar usuário de login do dashboard | Painel Supabase → **Authentication → Users → Add user → Create new user** | E-mail real + senha forte | Credencial que você vai usar no `/login` do dashboard. Pode criar vários. |
| B4 | Anotar Event ID e API Token do evento | Painel Supabase → **SQL Editor → New Query → rodar `SELECT id, slug, api_token, name FROM events;`** | Guarde os valores de `slug` e `api_token` do evento que acabou de criar (B2). | São os valores C1 e C2 usados no agente. |

---

## BLOCO C — Configuração do Agente Local (C# / Windows)

Arquivo alvo: `C:\Agent_Varcom\apps\local-agent\src\EventSalesAgent\appsettings.json`
(**Obs.:** Em produção, use **User Secrets** (`secrets.json.example`) para não gravar token no disco.)

```json
{
  "App": {
    "EventId":  "!!!COLOQUE AQUI O SLUG DO EVENTO (passo B4)!!!",
    "ApiBaseUrl": "http://localhost:3000",
    "ApiSyncEndpoint": "/api/sync/summary",
    "ApiToken": "!!!COLOQUE AQUI O api_token (passo B4)!!!",
    "UseMockDataSource": true,
    "SyncIntervalSeconds": 30
  }
}
```

| # | Campo JSON no appsettings | 1. Onde obter | 3. Formato / Exemplo | 4. Objetivo |
|---|---|---|---|---|
| C1 | `App.EventId` | Passo **B4** (coluna `slug` da tabela `events`) | `evento-demo-mock` | Faz o match entre os dados que o agente envia e qual evento está registrando no banco. |
| C2 | `App.ApiToken` | Passo **B4** (coluna `api_token` da tabela `events`). Deve ser o MESMO valor do seed B2. | `tok_xxxxxxxx_64chars_ou_mais` | Autenticação Bearer do agente contra a API `/api/sync/summary`. **Não pode vazar.** |
| C3 | `App.ApiBaseUrl` | Se rodando localmente: `http://localhost:3000`. Se em produção: sua URL do Vercel. | `http://localhost:3000` ou `https://meu-dash.vercel.app` | Base URL onde o dashboard está rodando. |
| C4 | `App.ApiSyncEndpoint` | Fixo por enquanto. | `/api/sync/summary` | Endpoint do POST de sync. Não precisa mudar. |
| C5 | `App.UseMockDataSource` | **Manter `true` (padrão)**. Só trocar para `false` depois do mapeamento manual do SQL Softvar. | `true` | Hoje: gera dados MOCK. |
| C6 | `App.SyncIntervalSeconds` | Padrão 30 s. Opções do PRD: 15/30/60/120. | `30` | Intervalo entre cada sincronização. |

---

## RESUMO DE PASSOS PARA COLOCAR MOCK FUNCIONANDO

1. Crie projeto Supabase → anote URL (A1), anon (A2), service_role (A3).
2. Preencha `.env.local` em `apps/web-dashboard/` com A1..A4.
3. No Supabase SQL Editor, rode **B1** (migration) e **B2** (seed — edite o api_token!).
4. No Supabase Auth, crie seu usuário (B3).
5. Rode uma query `SELECT id, slug, api_token, name FROM events;` → anote (B4).
6. Em `apps/local-agent/.../appsettings.json`: coloque **C1** (`slug`) e **C2** (`api_token`) de B4.
7. Pronto. Agora os runtimes (Node LTS + .NET 6 SDK) instalados, rode:
   - Terminal 1: `apps/web-dashboard > npm install ; npm run dev`
   - Terminal 2: `apps/local-agent/src/EventSalesAgent > dotnet restore ; dotnet run`
