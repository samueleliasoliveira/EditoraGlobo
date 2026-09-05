using EventSalesAgent.Config;
using EventSalesAgent.Models;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EventSalesAgent.Services;

/// <summary>
/// Worker principal: executa a cada SyncIntervalSeconds.
///   1) Coleta dados consolidados via ISqlDataSource (MOCK ou SQL Server).
///   2) Envia via ApiClient.
///   3) Em caso de queda de internet: não crasha, loga e tenta novamente no próximo ciclo.
/// </summary>
public class SyncWorker : BackgroundService
{
    private readonly AppConfig _cfg;
    private readonly ISqlDataSource _sql;
    private readonly IApiClient _api;
    private readonly ILogger<SyncWorker> _log;

    // Último status
    public DateTimeOffset? LastQueryAt { get; private set; }
    public DateTimeOffset? LastSendAt { get; private set; }
    public ConsolidatedSummary? LastSummary { get; private set; }
    public bool ApiOnline { get; private set; }
    public bool SqlOnline { get; private set; }
    public string? LastError { get; private set; }
    public DateTimeOffset NextRunAt { get; private set; }

    public SyncWorker(
        IOptions<AppConfig> cfg,
        ISqlDataSource sql,
        IApiClient api,
        ILogger<SyncWorker> log)
    {
        _cfg = cfg.Value;
        _sql = sql;
        _api = api;
        _log = log;
        NextRunAt = DateTimeOffset.Now;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _log.LogInformation(
            "SyncWorker iniciado. Evento={EventId} Intervalo={Intervalo}s DataSource={Ds}",
            _cfg.EventId, _cfg.SyncIntervalSeconds,
            _cfg.UseMockDataSource ? "MOCK" : "SQLSERVER_REAL (APÓS VALIDAÇÃO)");

        if (_cfg.UseMockDataSource)
        {
            _log.LogWarning(
                "ATENÇÃO: UseMockDataSource=true. Enviando DADOS SIMULADOS. " +
                "Para integração real, configure UseMockDataSource=false APÓS mapeamento do SQL.");
        }

        // Teste inicial rápido de conectividade (opcional; falhas não abortam o serviço)
        try { SqlOnline = await _sql.TestConnectionAsync(stoppingToken); }
        catch (Exception ex) { SqlOnline = false; LastError = ex.Message; _log.LogWarning(ex, "Teste inicial SQL falhou"); }

        while (!stoppingToken.IsCancellationRequested)
        {
            NextRunAt = DateTimeOffset.Now.AddSeconds(_cfg.SyncIntervalSeconds);
            try
            {
                await RunCycleAsync(stoppingToken).ConfigureAwait(false);
                LastError = null;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                LastError = ex.Message;
                _log.LogError(ex, "Falha no ciclo de sincronização. Próxima tentativa em {s}s", _cfg.SyncIntervalSeconds);
            }

            // Espera até o próximo ciclo. Usa loop pequeno para desligar rápido.
            var waitUntil = NextRunAt;
            while (DateTimeOffset.Now < waitUntil && !stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(500, stoppingToken).SuppressOrThrowCancellation().ConfigureAwait(false);
            }
        }
    }

    private async Task RunCycleAsync(CancellationToken ct)
    {
        // (1) Consultar fonte de dados (SQL ou MOCK)
        _log.LogDebug("Consultando fonte de dados...");
        ConsolidatedData dados;
        try
        {
            dados = await _sql.GetConsolidatedDataAsync(ct).ConfigureAwait(false);
            LastQueryAt = dados.GeneratedAt;
            SqlOnline = true;
            LastSummary = dados.Summary;
            _log.LogInformation(
                "Dados coletados. Total={C:C} Pedidos={P} Itens={I} Ticket={T:C} Ranking={R} produtos",
                dados.Summary.TotalSold, dados.Summary.OrdersCount,
                dados.Summary.ItemsCount, dados.Summary.AverageTicket,
                dados.ProductRanking.Count);
        }
        catch (Exception ex)
        {
            SqlOnline = false;
            LastError = ex.Message;
            _log.LogError(ex, "Erro ao consultar a fonte de dados.");
            return;
        }

        // (2) Enviar para API (HTTPS)
        _log.LogDebug("Enviando para API {Base}", _cfg.ApiBaseUrl);
        try
        {
            var res = await _api.SendConsolidatedAsync(dados, ct).ConfigureAwait(false);
            LastSendAt = DateTimeOffset.Now;
            ApiOnline = res.Success;
            if (res.Success)
            {
                _log.LogInformation("Sincronização concluída com sucesso. HTTP {S}", res.StatusCode);
            }
            else
            {
                LastError = res.Message;
                _log.LogWarning("API retornou erro: {Result}", res.ToString());
            }
        }
        catch (Exception ex)
        {
            ApiOnline = false;
            LastError = ex.Message;
            _log.LogError(ex, "Falha de rede/API. Dados NÃO foram perdidos (fonte SQL persistente). Próximo ciclo tentará novamente.");
        }
    }
}
