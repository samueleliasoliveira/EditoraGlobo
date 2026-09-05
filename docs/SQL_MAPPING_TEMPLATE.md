# Template de Mapeamento — Banco SQL Server Softvar

> Preencher SOMENTE quando o cliente fornecer a estrutura real do banco.
> NÃO inventar nomes de tabelas ou campos.

---

## 1. Dados de Conexão (fornecidos pelo cliente)

| Campo | Valor |
|---|---|
| Servidor SQL (ex: SERVIDOR01\SQLEXPRESS) | |
| Banco de dados | |
| Usuário de leitura (relatorio_evento) | |
| Senha (armazenada SOMENTE em appsettings local) | |

## 2. Tabelas e Campos

### Cabeçalho de Venda
- Tabela: `[dbo].[________]`
- ID da venda (chave primária): `_______`
- Data/hora da venda: `_______`
- Valor total da venda: `_______`
- Caixa / PDV: `_______`
- Situação / cancelada (flag): `_______`
- Valor de cancelamento / estorno (se houver): `_______`

### Itens da Venda
- Tabela: `[dbo].[________]`
- FK para cabeçalho: `_______`
- ID do item: `_______`
- Produto (FK): `_______`
- Quantidade: `_______`
- Valor unitário: `_______`
- Valor total item: `_______`
- Situação / cancelado: `_______`

### Produtos
- Tabela: `[dbo].[________]`
- ID produto: `_______`
- Nome / descrição: `_______`

## 3. Regras de Negócio

- Quais status de venda compõem o faturamento? (ex: somente autorizada/emitida)
- Como identificar venda cancelada / estornada?
- Como identificar item cancelado?
- Existe agrupamento por cupom fiscal / NF?

## 4. Queries Propostas (a validar)

> As queries serão escritas AQUI, em arquivo separado, e APRESENTADAS para revisão manual ANTES de qualquer execução.

**Query 1 — Resumo consolidado do dia (exemplo):**
```sql
-- SUBSTITUIR APÓS MAPEAMENTO REAL
SELECT
    -- campos reais
FROM dbo.??? v
WHERE v.??? >= @data_inicio
  AND v.status NOT IN ( /* canceladas */ )
-- COMANDO SOMENTE SELECT
```
