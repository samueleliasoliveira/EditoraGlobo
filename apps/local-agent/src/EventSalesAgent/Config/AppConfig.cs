namespace EventSalesAgent.Config;

public class AppConfig
{
    public const string Section = "App";
    public string EventId { get; set; } = "evento-demo-mock";
    public int SyncIntervalSeconds { get; set; } = 30;
    public string ApiBaseUrl { get; set; } = "http://localhost:3000";
    public string ApiSyncEndpoint { get; set; } = "/api/sync/summary";
    public string ApiToken { get; set; } = "";
    public int ApiTimeoutSeconds { get; set; } = 20;
    public int MaxRetryCount { get; set; } = 3;
    public bool UseMockDataSource { get; set; } = true;
    public int MockRandomSeed { get; set; } = 42;
}

public class SqlConfig
{
    public const string Section = "Sql";

    /// <summary>
    /// REGRA ABSOLUTA: usuário SOMENTE COM PERMISSÃO SELECT.
    /// NÃO armazenar senha hardcoded; usar User Secrets / variável de ambiente.
    /// </summary>
    public string ConnectionString { get; set; } = "";

    public int CommandTimeoutSeconds { get; set; } = 10;
}
