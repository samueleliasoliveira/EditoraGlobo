# Guia Rápido de Execução do MVP

> Pré-requisitos instalar uma única vez:
> 1. Node.js LTS (18 ou 20) — https://nodejs.org
> 2. .NET SDK 6.0 (compatível com Windows Server 2008 R2) — https://dotnet.microsoft.com/download/dotnet/6.0
> 3. Conta Supabase (gratuita) + projeto criado
> 4. Conta Vercel (gratuita, opcional inicialmente)

---

## PASSO 1 — Configurar Supabase / PostgreSQL Cloud

1. Crie um projeto no Supabase (https://supabase.com).
2. Copie:
   - `Project URL` → vira `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → vira `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` (Settings → API) → vira `SUPABASE_SERVICE_ROLE_KEY`
3. No **SQL Editor** do Supabase, execute:
   - Primeiro o conteúdo de:
     [0001_init_mvp.sql](../apps/web-dashboard/supabase/migrations/0001_init_mvp.sql)
   - Depois (opcional) crie o evento de exemplo:
     [seed.sql](../apps/web-dashboard/supabase/seed.sql)
   (**Edite o `api_token` do seed** para um valor seguro e único.)
4. No painel **Authentication → Users**, crie o seu usuário de login (e-mail + senha).

---

## PASSO 2 — Executar Dashboard Next.js (localmente)

Abra um terminal em `apps/web-dashboard`:

```powershell
cd C:\Agent_Varcom\apps\web-dashboard
```

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEUPROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...(service_role)
NEXTAUTH_SECRET=senha_aleatoria_grande
```

Instale dependências e inicie:

```powershell
npm install
npm run dev
```

Abre em: **http://localhost:3000**
- Faça login com o usuário criado no Passo 1.4.
- A princípio não haverá dados (cards zerados) até o agente começar a enviar.

---

## PASSO 3 — Executar Agente C# MOCK

Abra outro terminal em `apps/local-agent/src/EventSalesAgent`:

```powershell
cd C:\Agent_Varcom\apps\local-agent\src\EventSalesAgent
```

Verifique `appsettings.json` — por padrão já vem:
```json
"UseMockDataSource": true,
"ApiBaseUrl": "http://localhost:3000",
"ApiSyncEndpoint": "/api/sync/summary",
"ApiToken": "...token que você colocou no seed.sql..."
"EventId": "evento-demo-mock"
```

⚠️ **Ajuste `ApiToken` e `EventId`** para combinar exatamente com o evento que você cadastrou no Supabase.

Rode:

```powershell
dotnet restore
dotnet run
```

Você verá logs como:
```
[17:43:00 INF] Dados coletados. Total=R$1.234,56 Pedidos=37 Itens=89 Ticket=R$33,36 Ranking=10 produtos
[17:43:01 INF] Sincronização concluída com sucesso. HTTP 200
```

**Voltando ao dashboard (http://localhost:3000)**:
- Cards e ranking começam a crescer a cada 30s.
- Badge "Última atualização" muda de verde → amarelo se passar de 2 min sem sync.

---

## PASSO 4 — Publicar no Vercel (dashboard)

1. Commit do projeto em repositório Git (GitHub/GitLab/Bitbucket).
2. No Vercel → **New Project** → importe o repo.
3. **Root Directory**: selecione `apps/web-dashboard`.
4. Framework detectado = Next.js.
5. Em **Environment Variables**, cole as mesmas 4 variáveis do `.env.local`.
6. Deploy. ✅
7. **No agente**, ajuste `ApiBaseUrl` para `https://seu-projeto.vercel.app`.

---

## PASSO 5 — Publicar Agente (Windows Server) — PUBLICAÇÃO FUTURA

Quando quiser instalar no servidor Windows real:

```powershell
cd C:\Agent_Varcom\apps\local-agent\src\EventSalesAgent
dotnet publish -c Release -o C:\EventSalesAgent --self-contained true -r win-x64
```

Dentro de `C:\EventSalesAgent`, edite `appsettings.json` ou use User Secrets:

```powershell
dotnet user-secrets init
dotnet user-secrets set "Sql:ConnectionString" "Data Source=..."
dotnet user-secrets set "App:ApiToken" "..."
```

Criar como serviço Windows (opcional): `sc.exe create ... binPath= ...` ou usar NSSM.

---

## PASSO 6 — Integração SQL Server (SOMENTE QUANDO AUTORIZADO)

Quando o cliente fornecer tabelas/campos:
1. Preencher [SQL_MAPPING_TEMPLATE.md](../docs/SQL_MAPPING_TEMPLATE.md).
2. Escrever queries em [queries.sql](../apps/local-agent/src/EventSalesAgent/Queries/queries.sql) **comentadas**.
3. **Mostrar queries para revisão manual antes.**
4. Depois de aprovadas: implementar `SqlServerDataSource.cs`.
5. Criar usuário `relatorio_evento` via script [SQL_USER_CREATE_INSTRUCTIONS.sql](../docs/SQL_USER_CREATE_INSTRUCTIONS.sql).
6. Trocar `UseMockDataSource` para `false` no `appsettings.json`.
7. Testar em homologação primeiro.

---

## Registro Absoluto de Segurança

✅ SQL Server Softvar → **nunca exposto à internet** (somente agente local consulta).
✅ Agente → **somente SELECT** (usuário `relatorio_evento` db_datareader).
✅ Nenhuma senha SQL vai para o Supabase/Vercel/Git.
✅ Payload de sync **consolidado** (não envia venda por venda).
✅ Autenticação Bearer por evento (token no cabeçalho HTTPS).
✅ Integração SQL real só após aprovação manual.
