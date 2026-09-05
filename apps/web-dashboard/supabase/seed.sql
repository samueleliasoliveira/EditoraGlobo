-- SEED SQL — criar evento de exemplo (executar APENAS após migration 0001)
-- IMPORTANTE: substitua o api_token por um valor forte único por evento.
--
-- Exemplo de token seguro (gere um GUID):
--   PowerShell:  [guid]::NewGuid().ToString('n') + [guid]::NewGuid().ToString('n')
--   Bash:        uuidgen | tr -d '-' ; uuidgen | tr -d '-'

INSERT INTO public.events (name, slug, api_token, status, start_date, end_date)
VALUES (
    'Evento Demo MOCK',
    'evento-demo-mock',
    'tok_evento_demo_mock_MUDE_ESTE_VALOR_0000000000000000000000000001',
    'live',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '2 days'
)
ON CONFLICT (slug) DO NOTHING;
