# Guia Passo-a-Passo — Publicar Dashboard na Vercel + Supabase

> **Importante:** Nenhuma integração com SQL Server Softvar neste guia. Tudo 100% MOCK.

---

## FASE A — Criar e configurar Projeto Supabase

1. Acesse https://supabase.com/dashboard → **New project**.
2. Nomeie, ex: `event-sales-dashboard`. Escolha região mais próxima de você (ex: São Paulo).
3. Clique **Create new project**. Aguarde ~2 min.
4. Entre no projeto → menu **Project Settings → API**. Copie e **guarde localmente**:
   | Propriedade | Valor (exemplo) |
   |---|---|
   | Project URL | `https://abcxyz.supabase.co` |
   | anon `public` | Começa com `eyJhbGciOi...` |
   | service_role | Começa com `eyJhbGciOi...` |

5. Menu **SQL Editor → New Query** — cole o conteúdo deste arquivo e rode:
   [0001_init_mvp.sql](../apps/web-dashboard/supabase/migrations/0001_init_mvp.sql)
   → Confira a mensagem "Success. No rows returned".

6. **SQL Editor → New Query** — abra [seed.sql](../apps/web-dashboard/supabase/seed.sql), **edite `api_token`** antes de rodar. Gere um token forte, ex:
   ```powershell
   # Windows:
   [guid]::NewGuid().ToString('n') + [guid]::NewGuid().ToString('n')
   ```
   Substitua o valor do `api_token` no seed por essa string longa. Guarde esse valor também. Rode o seed.

7. (Opcional, confere o resultado) Rode `SELECT id, slug, api_token, name FROM events;`.
   Você deve ver 1 linha. Copie `slug` e `api_token` — vai pro agente.

8. Menu **Authentication → Users → Add user → Create new user**. Preencha seu e-mail real e uma senha forte — é sua credencial de login do dashboard.

9. **Segurança extra:** Project Settings → Authentication → **Email** — desabilite "Enable email confirmations" (para não precisar validar o e-mail agora).

---

## FASE B — Publicar Dashboard Next.js na Vercel

Forma recomendada (integração contínua):

1. **Commit do projeto** em um repositório Git (GitHub/GitLab/Bitbucket).
   ```
   C:\Agent_Varcom\
   → .gitignore está ok (node_modules, .env etc não vão para o repo).
   ```
2. Acesse https://vercel.com/new → importe o repositório.
3. Tela de configuração do projeto:
   - **Framework preset:** Next.js (detectado automaticamente).
   - **Root Directory:** IMPORTANTE! Clique em **Edit** e selecione `apps/web-dashboard`.
   - **Build Command:** `next build` (automático).
   - **Install Command:** `npm install`.
4. **Environment Variables** — crie **as 4 vars abaixo** (cole os valores da Fase A, passo 4):
   | Nome (exato) | Valor de onde veio | Tipo |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Public |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon `public` | Public |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role | **Encrypted/Secret** (SEGREDO) |
   | `NEXTAUTH_SECRET` | GUID longo (pode gerar: `[guid]::NewGuid().ToString('n')*2`) | **Secret** |
5. Clique **Deploy**. Aguarde 2–3 minutos.
6. Quando o deploy completar, a Vercel mostra uma URL tipo `https://seu-projeto.vercel.app`.
   **Anote essa URL.** É a `ApiBaseUrl` do agente C#.

---

## FASE C — Testar Login e API (sem agente C#)

1. Abra a URL da Vercel (ex.: `https://seu-projeto.vercel.app`).
2. Deve **imediatamente redirecionar** para `/login`. (Isso valida middleware.)
3. Faça login com e-mail/senha criado no passo A.8.
4. Se tudo ok, você vê o dashboard vazio (zeros, badge "Aguardando primeira sincronização"). ✅

5. **Testar API de sync (smoke test PowerShell):**
   Edite o cabeçalho de [smoke-test-api.ps1](../docs/smoke-test-api.ps1):
   - `$baseUrl`  = "https://seu-projeto.vercel.app"
   - `$apiToken` = token do evento (passo A.6, valor do seed)
   - `$eventId`  = slug do evento (passo A.6)
   Execute:
   ```powershell
   cd C:\Agent_Varcom\docs
   powershell -ExecutionPolicy Bypass -File .\smoke-test-api.ps1
   ```
   Esperado: `[OK] HTTP 200 — Total=R$...`.
   Volte no dashboard, atualize: valores e ranking aparecem. ✅

---

## FASE D — Rodar Agente C# MOCK apontando para a Vercel

1. Em `C:\Agent_Varcom\apps\local-agent\src\EventSalesAgent\appsettings.json`:
   ```json
   {
     "App": {
       "EventId":  "SLUG DO PASSO A.7",
       "ApiBaseUrl": "https://seu-projeto.vercel.app",
       "ApiSyncEndpoint": "/api/sync/summary",
       "ApiToken": "TOKEN GRANDE DO PASSO A.6",
       "UseMockDataSource": true,
       "SyncIntervalSeconds": 30
     }
   }
   ```
2. Instale .NET SDK 8 (ou 7, qualquer versão compatível — runtime final do servidor Softvar será decidido depois):
   ```
   https://dotnet.microsoft.com/download
   ```
3. Rode:
   ```powershell
   cd C:\Agent_Varcom\apps\local-agent\src\EventSalesAgent
   dotnet restore
   dotnet build
   dotnet run
   ```
4. Volte no dashboard (URL da Vercel).
   - A cada ~30s, cards crescem. ✅ (ponto 9 "Dashboard atualizado")
   - Badge verde (há menos de 2 min). ✅
   - Auto-refresh funciona (teste sem F5 1 min). ✅
5. **Teste de interrupção:** pare o agent (Ctrl+C), espere > 2 minutos → badge AMARELO com aviso de dados desatualizados. Cards não são zerados. ✅
6. **Teste de retorno:** rode `dotnet run` novamente → badge volta VERDE em ~30s. ✅

---

## Fase E — Próximos passos?

**Pare aqui.** Não implemente integração SQL Server.
Após todos os testes aprovados, nós fazemos o mapeamento do Softvar.
