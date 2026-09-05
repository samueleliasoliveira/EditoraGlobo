using EventSalesAgent.Config;
using EventSalesAgent.Models;
using Microsoft.Extensions.Options;

namespace EventSalesAgent.Services;

/// <summary>
/// CONEXÃO REAL com o SQL Server 2008 R2 da Softvar.
///
/// ============================================================================
///  REGRA ABSOLUTA — NÃO HABILITAR SEM AUTORIZAÇÃO E MAPEAMENTO MANUAL
/// ============================================================================
///
///  - Usuário SQL: SOMENTE permissão SELECT (relatorio_evento).
///  - NUNCA executar INSERT / UPDATE / DELETE / MERGE / ALTER / DROP / CREATE.
///  - Todas as queries devem estar em ./Queries/queries.sql e validadas.
///  - CommandTimeout configurado (padrão 10s) para não impactar os caixas.
///  - NÃO usar SELECT *. Selecionar SOMENTE os campos necessários.
///  - Consultas parametrizadas.
///  - Se a query for pesada: NÃO EXECUTAR. Propor alternativa antes.
///
///  Esta implementação fica LANCADA EXCEÇÃO por enquanto.
///  Editar APENAS após o cliente fornecer:
///     servidores, tabelas, campos, relacionamentos, regras de cancelamento
///     e as queries SELECT devidamente validadas.
/// </summary>
public class SqlServerDataSource : ISqlDataSource
{
    private readonly SqlConfig _sqlCfg;

    public SqlServerDataSource(IOptions<SqlConfig> sqlCfg)
    {
        _sqlCfg = sqlCfg.Value;
    }

    public Task<bool> TestConnectionAsync(CancellationToken ct)
    {
        throw new NotImplementedException(
            "SqlServerDataSource: implementação ainda não liberada. " +
            "Aguardando mapeamento manual das tabelas do SQL Server Softvar e queries validadas. " +
            "Por enquanto utilize MockSqlDataSource (UseMockDataSource=true).");
    }

    public Task<ConsolidatedData> GetConsolidatedDataAsync(CancellationToken ct)
    {
        throw new NotImplementedException(
            "SqlServerDataSource: somente SELECT é permitido e as queries ainda não foram " +
            "fornecidas/validadas. Utilize MockSqlDataSource até nova autorização.");
    }
}
