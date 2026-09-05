using EventSalesAgent.Models;

namespace EventSalesAgent.Services;

/// <summary>
/// Abstração para a fonte dos dados consolidados.
/// Implementações:
///   - MockSqlDataSource: dados simulados (MODO DEFAULT HOJE)
///   - SqlServerDataSource: conexão REAL com SQL Server 2008 R2
///     (SOMENTE SELECT; criada APÓS mapeamento e validação manual).
/// </summary>
public interface ISqlDataSource
{
    Task<ConsolidatedData> GetConsolidatedDataAsync(CancellationToken ct);
    Task<bool> TestConnectionAsync(CancellationToken ct);
}
