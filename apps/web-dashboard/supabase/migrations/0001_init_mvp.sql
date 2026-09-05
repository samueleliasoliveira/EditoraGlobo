-- MIGRATION 0001 — INIT MVP (agora com RLS e grants explícitos SEGUROS)
-- Banco: Supabase / PostgreSQL
-- Objetivo: schema mínimo para MVP com indicadores consolidados.
--
-- ========================================================================
--  MODELO DE SEGURANÇA DE ACESSO (estrito, não público)
-- ========================================================================
--  Navegador (bundle JS)  ->  NUNCA acessa tabelas diretamente.
--                             Usa Next.js SSR/API route que valida sessão e
--                             consulta com SERVICE_ROLE no backend.
--
--  Papéis (roles):
--   - postgres / service_role     -> bypass RLS (acesso total, backend Next.js)
--   - anon                        -> NENHUM acesso (nem SELECT) nas tabelas do app
--   - authenticated               -> NENHUM acesso direto (nem SELECT) nas tabelas do app
--
--  Prefixo NEXT_PUBLIC_ (variáveis de ambiente):
--   - Contém SOMENTE URL e PUBLISHABLE_KEY (chave anônima de sessão).
--   - NUNCA service_role / secret keys / sync tokens.
-- ========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================================
-- EVENTS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(80) NOT NULL UNIQUE,
    api_token VARCHAR(120) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'planned'
        CHECK (status IN ('planned','live','finished','archived')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================================
-- CONSOLIDATED_SNAPSHOTS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.consolidated_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    generated_at TIMESTAMPTZ NOT NULL,
    total_sold NUMERIC(14,2) NOT NULL DEFAULT 0,
    orders_count INTEGER NOT NULL DEFAULT 0,
    items_count INTEGER NOT NULL DEFAULT 0,
    average_ticket NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================================
-- PRODUCT_RANKINGS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.product_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID NOT NULL
        REFERENCES public.consolidated_snapshots(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL CHECK (rank > 0),
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    revenue NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================================
-- ÍNDICES (performance)
-- ========================================================================
CREATE INDEX IF NOT EXISTS idx_events_slug            ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_api_token       ON public.events(api_token);
CREATE INDEX IF NOT EXISTS idx_snapshots_event_created ON public.consolidated_snapshots(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rankings_snapshot      ON public.product_rankings(snapshot_id, rank ASC);

-- ========================================================================
-- RLS: HABILITAR EM TODAS AS TABELAS
-- ========================================================================
ALTER TABLE public.events                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consolidated_snapshots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_rankings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                   FORCE ROW LEVEL SECURITY;
ALTER TABLE public.consolidated_snapshots   FORCE ROW LEVEL SECURITY;
ALTER TABLE public.product_rankings         FORCE ROW LEVEL SECURITY;

-- ========================================================================
-- GRANTS PRIVADOS: ANON e AUTHENTICATED -> NÃO ACESSAM NADA
-- ========================================================================
-- (1) REVOGAR qualquer permissão que tenha vindo por herança public padrão.
REVOKE ALL ON TABLE public.events                   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.consolidated_snapshots   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.product_rankings         FROM PUBLIC, anon, authenticated;

-- (2) GRANT EXPLÍCITO para os papéis SOBRE AS TABELAS -> NADA (0 privilégios).
--     Qualquer tentativa de SELECT/INSERT/UPDATE/DELETE por anon/authenticated
--     resultará em "permission denied" ou, se RLS passar, 0 linhas.

-- Opcional: garantir que sequences (gen_random_uuid() não usa, mas por via das dúvidas)
-- também não estejam expostos.
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- ========================================================================
-- RLS POLICIES (ZERADAS — nenhuma política liberada para anon/authenticated)
--
-- Como policy padrão "nenhuma policy = default deny":
--   Mesmo que alguém conseguisse um GRANT SELECT enganosamente, RLS negaria.
--   Aqui criamos policies explícitas "deny all" para ficar óbvio e
--   impossibilitar futuras políticas herdadas.
-- ========================================================================
-- EVENTS
DROP POLICY IF EXISTS events_deny_all_anon  ON public.events;
CREATE POLICY events_deny_all_anon  ON public.events FOR ALL USING (false) WITH CHECK (false);

-- CONSOLIDATED_SNAPSHOTS
DROP POLICY IF EXISTS snapshots_deny_all_anon  ON public.consolidated_snapshots;
CREATE POLICY snapshots_deny_all_anon  ON public.consolidated_snapshots FOR ALL USING (false) WITH CHECK (false);

-- PRODUCT_RANKINGS
DROP POLICY IF EXISTS rankings_deny_all_anon  ON public.product_rankings;
CREATE POLICY rankings_deny_all_anon  ON public.product_rankings FOR ALL USING (false) WITH CHECK (false);

-- ========================================================================
-- OWNERSHIP: garantir que o dono da tabela é o superuser/pgbouncer
-- (service_role e postgres bypass RLS automaticamente pelo Supabase)
-- ========================================================================
ALTER TABLE public.events                   OWNER TO postgres;
ALTER TABLE public.consolidated_snapshots   OWNER TO postgres;
ALTER TABLE public.product_rankings         OWNER TO postgres;

-- ========================================================================
-- COMENTÁRIOS DE SEGURANÇA (auditável)
-- ========================================================================
COMMENT ON TABLE public.events IS
  'Cadastro multi-evento. NÃO ACESSÍVEL DIRETAMENTE PELO BROWSER. Apenas service_role.';
COMMENT ON TABLE public.consolidated_snapshots IS
  'Indicadores consolidados por sincronização. NÃO PÚBLICO. Apenas service_role.';
COMMENT ON TABLE public.product_rankings IS
  'Ranking produtos por snapshot. NÃO PÚBLICO. Apenas service_role.';
