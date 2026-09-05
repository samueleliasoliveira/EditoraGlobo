# Arquitetura do Sistema — Dashboard de Vendas para Eventos

## Visão Geral

Sistema de monitoramento de vendas em tempo quase real para eventos.
Arquitetura outbound: SQL Server local → Agente C# → API HTTPS → PostgreSQL → Dashboard Web.

## Componentes

### 1. Agente Local (C# / .NET 6 — apps/local-agent)
- Instalado no servidor Windows com SQL Server 2008 R2.
- Executa SOMENTE comandos SELECT no banco operacional (usuário de leitura exclusiva).
- Intervalo de sync padrão: 30 segundos.
- Usa `ISqlDataSource` (abstração) — MVP usa `MockSqlDataSource`.
- Envia payload consolidado via `POST /api/sync/summary` (Bearer Token por evento).
- Persiste em retry e não crasha com queda de internet.

### 2. API de Sync (Next.js Route Handler — apps/web-dashboard/app/api/sync/summary/route.ts)
- Autenticação por Bearer Token armazenado em `events.api_token`.
- Valida schema do payload com Zod.
- Faz UPSERT consolidado por evento.

### 3. Banco Cloud (PostgreSQL / Supabase)
- `events`: cadastro de eventos e API tokens.
- `consolidated_snapshots`: indicadores consolidados (total vendido, pedidos, itens, ticket médio).
- `product_rankings`: ranking de produtos por snapshot.
- Auth: usuários gerenciados via Supabase Auth.

### 4. Dashboard (Next.js + Tailwind — Vercel)
- Autenticação por e-mail/senha (Supabase Auth).
- Mobile-first.
- Atualização automática a cada 30s.
- Cards: Total Vendido, Pedidos, Itens Vendidos, Ticket Médio.
- Tabela: Ranking produtos mais vendidos (qtd + faturamento).
- Badge: Última atualização / aviso de atraso > 2min.

## Payload de Sync (MVP Consolidado)

```json
{
  "eventId": "slug-evento",
  "generatedAt": "ISO-8601",
  "summary": { "totalSold": 0, "ordersCount": 0, "itemsCount": 0, "averageTicket": 0 },
  "productRanking": [
    { "rank": 1, "productId": "123", "productName": "...", "quantity": 0, "revenue": 0 }
  ]
}
```

## Regras de Segurança Absolutas

- NUNCA expor SQL Server 2008 R2 à internet.
- NUNCA executar INSERT/UPDATE/DELETE/MERGE/ALTER/DROP/CREATE no banco operacional Softvar.
- Usuário SQL = SOMENTE permissão SELECT (criação manual pelo DBA da Softvar).
- Credenciais SQL NUNCA saem do servidor local.
- Integração SQL real somente após mapeamento e validação manual.
