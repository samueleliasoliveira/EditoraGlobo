-- =====================================================================
--  QUERIES SQL — EXECUTADAS SOMENTE APÓS MAPEAMENTO MANUAL
--
--  REGRA ABSOLUTA:
--    * SOMENTE COMANDOS SELECT.
--    * NÃO EXECUTAR NENHUMA DESTAS QUERIES ANTES DE VALIDAÇÃO HUMANA.
--    * NÃO CRIAR NENHUM OBJETO (VIEW / TABELA / ÍNDICE / PROCEDURE).
--    * USUÁRIO: relatorio_evento (SOMENTE permissão db_datareader).
--
--  Preencher conforme o cliente fornecer: tabelas, campos e regras de negócio.
-- =====================================================================


-- =====================================================================
--  CONSULTA 1 — Resumo consolidado (total vendido, pedidos, itens, ticket médio)
--  ATENÇÃO: Substitua "?????? e campos pelos NOMES REAIS APÓS MAPEAMENTO.
-- =====================================================================
/*
SELECT
    SUM(COALESCE(v.????????_valor_total, 0))                 AS total_sold,
    COUNT_BIG(DISTINCT v.?????????id_venda)                 AS orders_count,
    SUMCOALESCE(vi.????????_quantidade, 0))                        AS items_count,
    CASE WHEN COUNT_BIG(DISTINCT v.?????????id_venda) > 0
         THEN SUMCOALESCE(v.????????_valor_total, 0))
            / COUNT_BIG(DISTINCT v.?????????id_venda)
         ELSE 0 END                                            AS average_ticket
FROM dbo.??????????_vendas v
INNER JOIN dbo.????????????_itens vi ON v.?????????id_venda = vi.????????_id_venda
WHERE v.?????????data_venda >= @data_referencia
  AND v.????????_cancelada  = 0
OPTION (MAXDOP 1);
-- OMITIR (NOLOCK) SOMENTE se autorizado; padrão = NÃO.
*/


-- =====================================================================
--  CONSULTA 2 — Ranking produtos mais vendidos TOP 50
-- =====================================================================
/*
SELECT TOP (50)
    ROW_NUMBER() OVER (ORDER BY SUMCOALESCE(vi.????????_quantidade, 0)) DESC,
        p.????????_id_produto ASC)                 AS rank,
    p.????????_id_produto                                 AS product_id,
    p.????????_descricao                                   AS product_name,
    SUMCOALESCE(vi.????????_quantidade, 0))                AS quantity,
    SUMCOALESCE(vi.????????_quantidade * vi.????????_preco_unitario, 0)) AS revenue
FROM dbo.??????????_vendas v
INNER JOIN dbo.????????????_itens vi ON v.?????????id_venda = vi.????????_id_venda
INNER JOIN dbo.????????_produtos  p  ON p.????????_id_produto = vi.????????_id_produto
WHERE v.?????????data_venda >= @data_referencia
  AND v.????????_cancelada  = 0
  AND vi.???????_item_cancelado = 0
GROUP BY p.????????_id_produto, p.????????_descricao
ORDER BY quantity DESC, product_id ASC
OPTION (MAXDOP 1);
*/


-- =====================================================================
--  HISTÓRICO / DICAS DE IMPLEMENTAÇÃO
-- =====================================================================
--  - Evitar SELECT *.
--  - Evitar funções em colunas indexadas em WHERE (SARGable).
--  - Não alterar isolation level global.
--  - CommandTimeout = 10 segundos (configurável).
--  - Se impacto nos caixas: reduzir frequência / limitar rows / filtrar período.
